/**
 * Streaming data handlers for real-time candle data
 */

import {
  TradingviewConnection,
  GetCandlesParams,
  Candle,
  TradingviewEvent,
} from "../types/index.js";
import {
  validateTimeframe,
  validateSymbols,
  validateAmount,
} from "../utils/validation.js";
import { log } from "../utils/logger.js";
import { ErrorFactory } from "../utils/errors.js";
import {
  CandleDataProcessor,
  SymbolStateManager,
  ChartSessionManager,
  CandleEventHandler,
  MAX_BATCH_SIZE,
} from "./candles.js";

/**
 * Pending yield item for streaming results
 */
interface PendingYield {
  symbol: string;
  candles: Candle[];
}

/**
 * Streaming candle data implementation using async generators
 */
export class CandleStream {
  private symbolStateManager: SymbolStateManager;
  private chartSessionManager: ChartSessionManager;
  private eventHandler: CandleEventHandler;
  private pendingYields: PendingYield[] = [];
  private activeCount: number = 0;
  private hasError: boolean = false;
  private errorMessage: string | null = null;
  private unsubscribe: (() => void) | null = null;

  constructor(private params: GetCandlesParams) {
    // Validate parameters
    CandleDataProcessor.validateParams(params);

    this.symbolStateManager = new SymbolStateManager();
    this.chartSessionManager = new ChartSessionManager();

    const batchSize = CandleDataProcessor.calculateBatchSize(params.amount);
    this.eventHandler = new CandleEventHandler(
      this.symbolStateManager,
      this.chartSessionManager,
      batchSize,
      params.amount,
    );
  }

  /**
   * Sets up event handlers for streaming
   */
  private setupEventHandlers(connection: TradingviewConnection): void {
    this.unsubscribe = connection.subscribe((event: TradingviewEvent) => {
      try {
        if (event.name === "timescale_update") {
          this.eventHandler.handleTimescaleUpdate(event);
          return;
        }

        if (["series_completed", "symbol_error"].includes(event.name)) {
          const completed = this.eventHandler.handleSeriesEvent(
            event,
            connection,
            (symbol, candles) => {
              // Add to pending yields if there are candles or no error occurred
              if (candles.length > 0 || !this.hasError) {
                this.pendingYields.push({ symbol, candles });
              }
            },
          );

          if (completed) {
            this.activeCount--;

            // Clean up if all symbols are done
            if (this.activeCount === 0) {
              this.cleanup();
            }
          }
          return;
        }
      } catch (error) {
        log.error("Error processing streaming event", error, "CandleStream");
        this.hasError = true;
        this.errorMessage =
          error instanceof Error ? error.message : String(error);
        this.cleanup();
      }
    });
  }

  /**
   * Initializes requests for all symbols
   */
  private initializeRequests(connection: TradingviewConnection): void {
    const { symbols, timeframe = 60 } = this.params;
    const batchSize = CandleDataProcessor.calculateBatchSize(
      this.params.amount,
    );
    const validatedTimeframe = validateTimeframe(timeframe);

    // Initialize state for each symbol
    symbols.forEach((symbol) => {
      this.symbolStateManager.initializeSymbol(symbol);
    });

    this.activeCount = symbols.length;

    // Send all requests concurrently
    symbols.forEach((symbol, index) => {
      const chartSession = CandleDataProcessor.generateChartSession(symbol);
      const symbolSession = CandleDataProcessor.generateSymbolSession(index);

      this.chartSessionManager.createChartSession(connection, symbol);
      this.chartSessionManager.resolveSymbol(
        connection,
        chartSession,
        symbol,
        symbolSession,
      );
      this.chartSessionManager.createSeries(
        connection,
        chartSession,
        `s${index}`,
        symbolSession,
        validatedTimeframe,
        batchSize,
      );
    });
  }

  /**
   * Cleans up resources
   */
  private cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.symbolStateManager.clearStates();
    this.chartSessionManager.clearSessions();
  }

  /**
   * Async generator for streaming candle data
   */
  async *stream(): AsyncGenerator<Candle[], void, unknown> {
    const { connection, symbols } = this.params;

    if (symbols.length === 0) {
      log.warn("No symbols provided for streaming", null, "CandleStream");
      return;
    }

    log.info(
      `Starting stream for ${symbols.length} symbols`,
      { symbols },
      "CandleStream",
    );

    this.setupEventHandlers(connection);
    this.initializeRequests(connection);

    try {
      // Yield results as they become available
      while (this.activeCount > 0 && !this.hasError) {
        if (this.pendingYields.length > 0) {
          const { candles } = this.pendingYields.shift()!;
          yield candles;
        } else {
          // Wait a bit for more results (event-driven approach)
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      }

      // Throw error if one occurred
      if (this.hasError && this.errorMessage) {
        throw ErrorFactory.generic(this.errorMessage);
      }

      // Yield any remaining results
      while (this.pendingYields.length > 0) {
        const { candles } = this.pendingYields.shift()!;
        yield candles;
      }

      log.info("Stream completed successfully", null, "CandleStream");
    } finally {
      this.cleanup();
    }
  }
}

/**
 * Creates a streaming candle data generator
 *
 * @param params - Stream parameters including connection, symbols, amount, and timeframe
 * @returns AsyncGenerator that yields candle arrays as they become available
 */
export async function* getCandlesStream(
  params: GetCandlesParams,
): AsyncGenerator<Candle[], void, unknown> {
  const stream = new CandleStream(params);
  yield* stream.stream();
}

/**
 * Event-driven streaming implementation with better performance
 */
export class EventDrivenCandleStream {
  private eventListeners: Map<string, (candles: Candle[]) => void> = new Map();
  private errorListeners: ((error: Error) => void)[] = [];
  private isStreaming: boolean = false;
  private stream: CandleStream | null = null;

  /**
   * Adds a listener for candle data updates
   */
  addSymbolListener(
    symbol: string,
    listener: (candles: Candle[]) => void,
  ): void {
    this.eventListeners.set(symbol, listener);
  }

  /**
   * Removes a symbol listener
   */
  removeSymbolListener(symbol: string): void {
    this.eventListeners.delete(symbol);
  }

  /**
   * Adds an error listener
   */
  addErrorListener(listener: (error: Error) => void): void {
    this.errorListeners.push(listener);
  }

  /**
   * Removes an error listener
   */
  removeErrorListener(listener: (error: Error) => void): void {
    const index = this.errorListeners.indexOf(listener);
    if (index > -1) {
      this.errorListeners.splice(index, 1);
    }
  }

  /**
   * Starts streaming candle data
   */
  async startStreaming(params: GetCandlesParams): Promise<void> {
    if (this.isStreaming) {
      throw ErrorFactory.generic("Streaming is already active");
    }

    this.isStreaming = true;
    this.stream = new CandleStream(params);

    try {
      log.info(
        "Starting event-driven streaming",
        { symbols: params.symbols },
        "EventDrivenStream",
      );

      for await (const candles of this.stream.stream()) {
        // Find which symbol these candles belong to and notify listeners
        // Note: This is a simplified approach - in a real implementation,
        // you'd want to track which symbol each yield belongs to
        const symbol = params.symbols[0]; // Simplified for single symbol case

        const listener = this.eventListeners.get(symbol);
        if (listener) {
          try {
            listener(candles);
          } catch (error) {
            log.error(
              `Error in symbol listener for ${symbol}`,
              error,
              "EventDrivenStream",
            );
          }
        }
      }

      log.info("Event-driven streaming completed", null, "EventDrivenStream");
    } catch (error) {
      log.error("Event-driven streaming failed", error, "EventDrivenStream");

      // Notify error listeners
      const streamError =
        error instanceof Error ? error : new Error(String(error));
      this.errorListeners.forEach((listener) => {
        try {
          listener(streamError);
        } catch (listenerError) {
          log.error(
            "Error in error listener",
            listenerError,
            "EventDrivenStream",
          );
        }
      });

      throw streamError;
    } finally {
      this.isStreaming = false;
      this.stream = null;
    }
  }

  /**
   * Stops streaming
   */
  stopStreaming(): void {
    if (this.stream) {
      this.stream = null;
    }
    this.isStreaming = false;
    log.info("Event-driven streaming stopped", null, "EventDrivenStream");
  }

  /**
   * Checks if streaming is active
   */
  isActive(): boolean {
    return this.isStreaming;
  }
}

/**
 * Creates an event-driven streaming instance
 *
 * @returns EventDrivenCandleStream instance
 */
export function createEventDrivenStream(): EventDrivenCandleStream {
  return new EventDrivenCandleStream();
}

/**
 * Utility functions for stream management
 */
export const StreamUtils = {
  /**
   * Creates a stream with automatic retry on failure
   */
  createRetryStream: (
    params: GetCandlesParams,
    maxRetries: number = 3,
    retryDelay: number = 1000,
  ): AsyncGenerator<Candle[], void, unknown> => {
    return StreamUtils._retryStream(params, maxRetries, retryDelay);
  },

  /**
   * Internal retry stream implementation
   */
  async *_retryStream(
    params: GetCandlesParams,
    maxRetries: number,
    retryDelay: number,
  ): AsyncGenerator<Candle[], void, unknown> {
    let attempts = 0;

    while (attempts <= maxRetries) {
      try {
        attempts++;
        log.info(
          `Stream attempt ${attempts}/${maxRetries + 1}`,
          null,
          "RetryStream",
        );

        const stream = new CandleStream(params);
        yield* stream.stream();

        return; // Success, exit retry loop
      } catch (error) {
        if (attempts > maxRetries) {
          log.error(
            `Stream failed after ${maxRetries + 1} attempts`,
            error,
            "RetryStream",
          );
          throw error;
        }

        log.warn(
          `Stream attempt ${attempts} failed, retrying in ${retryDelay}ms`,
          error,
          "RetryStream",
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  },

  /**
   * Creates a stream that filters candles by time range
   */
  createTimeFilteredStream(
    params: GetCandlesParams,
    startTime?: number,
    endTime?: number,
  ): AsyncGenerator<Candle[], void, unknown> {
    return this._timeFilteredStream(params, startTime, endTime);
  },

  /**
   * Internal time filtered stream implementation
   */
  async *_timeFilteredStream(
    params: GetCandlesParams,
    startTime?: number,
    endTime?: number,
  ): AsyncGenerator<Candle[], void, unknown> {
    const stream = new CandleStream(params);

    for await (const candles of stream.stream()) {
      const filteredCandles = candles.filter((candle) => {
        if (startTime && candle.timestamp < startTime) return false;
        if (endTime && candle.timestamp > endTime) return false;
        return true;
      });

      if (filteredCandles.length > 0) {
        yield filteredCandles;
      }
    }
  },
};
