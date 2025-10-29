/**
 * TradingView WebSocket API - Browser-compatible library for accessing market data
 *
 * This library provides a clean interface for accessing TradingView candlestick data
 * through WebSocket connections with support for multiple endpoints and concurrent requests.
 *
 * @version 0.0.8
 * @author badsector666 <badsectorkiller666@gmail.com>
 * @license MIT
 */

// Export core types and interfaces
export {
  // Type definitions
  Candle,
  RawCandle,
  TradingviewConnection,
  ConnectionOptions,
  TradingviewEvent,
  TradingviewTimeframe,
  FlexibleTimeframe,
  TradingviewEndpoint,
  GetCandlesParams,
  SymbolState,
  Subscriber,
  Unsubscriber,
  MessagePayload,
  MessageType,

  // Constants
  ENDPOINTS,
} from "./types/index.js";

// Export connection management
export { connectToEndpoint, MAX_BATCH_SIZE } from "./connection/websocket.js";

// Export validation utilities
export {
  validateTimeframe,
  validateSymbol,
  validateAmount,
  validateSymbols,
  validateConnectionOptions,
} from "./utils/validation.js";

// Export candle data processing utilities
export {
  CandleDataProcessor,
  SymbolStateManager,
  ChartSessionManager,
  CandleEventHandler,
  MAX_BATCH_SIZE as CANDLE_MAX_BATCH_SIZE,
} from "./data/candles.js";

// Export streaming functionality
export {
  CandleStream,
  EventDrivenCandleStream,
  createEventDrivenStream,
  StreamUtils,
} from "./data/stream.js";

// Export error handling
export {
  TradingViewError,
  ConnectionError,
  AuthenticationError,
  DataError,
  ValidationError,
  ProtocolError,
  TimeoutError,
  ErrorFactory,
  ErrorHandler,
} from "./utils/errors.js";

// Export logging system
export {
  Logger,
  LogLevel,
  logger,
  log,
  LogLevelUtils,
} from "./utils/logger.js";

// Import internal implementations
import {
  connect as _connect,
  MAX_BATCH_SIZE as _MAX_BATCH_SIZE,
} from "./connection/websocket.js";
import {
  CandleDataProcessor,
  SymbolStateManager,
  ChartSessionManager,
  CandleEventHandler,
} from "./data/candles.js";
import { getCandlesStream as _getCandlesStream } from "./data/stream.js";
import {
  TradingviewConnection,
  GetCandlesParams,
  Candle,
} from "./types/index.js";
import { log } from "./utils/logger.js";
import { ErrorFactory } from "./utils/errors.js";
import { validateTimeframe } from "./utils/validation.js";

/**
 * Fetches historical candlestick data for specified symbols using sequential processing
 *
 * This function processes symbols one at a time, which is useful for rate limiting
 * or when you need to ensure deterministic order of processing.
 *
 * @param params - Object containing connection, symbols, amount, and timeframe
 * @returns Promise resolving to array of candle arrays, one per symbol
 *
 * @example
 * ```typescript
 * const candles = await getCandles({
 *   connection,
 *   symbols: ['FX:EURUSD', 'BINANCE:BTCUSDT'],
 *   amount: 100,
 *   timeframe: '1D'
 * });
 * ```
 */
export async function getCandles(
  params: GetCandlesParams,
): Promise<Candle[][]> {
  const { connection, symbols, amount, timeframe = 60 } = params;

  // Validate parameters
  CandleDataProcessor.validateParams(params);

  if (symbols.length === 0) {
    log.warn("No symbols provided for getCandles", null, "getCandles");
    return [];
  }

  log.info(
    `Fetching candles for ${symbols.length} symbols`,
    { symbols, amount, timeframe },
    "getCandles",
  );

  const chartSession = CandleDataProcessor.generateChartSession();
  const batchSize = CandleDataProcessor.calculateBatchSize(amount);
  const validatedTimeframe = validateTimeframe(timeframe);

  return new Promise<Candle[][]>((resolve, reject) => {
    const allCandles: Candle[][] = [];
    let currentSymIndex = 0;
    let symbol = symbols[currentSymIndex];
    let currentSymCandles: any[] = [];

    const unsubscribe = connection.subscribe((event) => {
      try {
        // Handle new candle data
        if (event.name === "timescale_update") {
          let newCandles: any[] = event.params[1]["sds_1"]["s"];
          if (newCandles.length > batchSize) {
            // Sometimes tradingview sends already received candles
            newCandles = CandleDataProcessor.filterNewCandles(
              newCandles,
              currentSymCandles,
              batchSize,
            );
          }
          currentSymCandles = newCandles.concat(currentSymCandles);
          log.trace(
            `Received ${newCandles.length} candles for ${symbol}`,
            null,
            "getCandles",
          );
          return;
        }

        // Handle completion or error
        if (["series_completed", "symbol_error"].includes(event.name)) {
          const loadedCount = currentSymCandles.length;

          if (CandleDataProcessor.shouldRequestMoreData(loadedCount, amount)) {
            connection.send("request_more_data", [
              chartSession,
              "sds_1",
              batchSize,
            ]);
            return;
          }

          // Process completed candles for current symbol
          if (amount) {
            currentSymCandles = currentSymCandles.slice(0, amount);
          }

          const processedCandles =
            CandleDataProcessor.processCandles(currentSymCandles);
          allCandles.push(processedCandles);

          log.debug(
            `Completed ${symbol}: ${processedCandles.length} candles`,
            null,
            "getCandles",
          );

          // Move to next symbol or finish
          if (symbols.length - 1 > currentSymIndex) {
            currentSymCandles = [];
            currentSymIndex += 1;
            symbol = symbols[currentSymIndex];

            connection.send("resolve_symbol", [
              chartSession,
              `sds_sym_${currentSymIndex}`,
              "=" + JSON.stringify({ symbol, adjustment: "splits" }),
            ]);

            connection.send("modify_series", [
              chartSession,
              "sds_1",
              `s${currentSymIndex}`,
              `sds_sym_${currentSymIndex}`,
              validatedTimeframe,
              "",
            ]);

            log.debug(`Moving to next symbol: ${symbol}`, null, "getCandles");
            return;
          }

          // All symbols loaded
          unsubscribe();
          log.info(
            `Successfully fetched candles for all ${symbols.length} symbols`,
            null,
            "getCandles",
          );
          resolve(allCandles);
        }
      } catch (error) {
        log.error("Error processing candle data", error, "getCandles");
        reject(
          ErrorFactory.dataParsingError(
            symbol,
            error instanceof Error ? error : undefined,
          ),
        );
      }
    });

    // Initialize request
    connection.send("chart_create_session", [chartSession, ""]);
    connection.send("resolve_symbol", [
      chartSession,
      `sds_sym_0`,
      "=" + JSON.stringify({ symbol, adjustment: "splits" }),
    ]);
    connection.send("create_series", [
      chartSession,
      "sds_1",
      "s0",
      "sds_sym_0",
      validatedTimeframe,
      batchSize,
      "",
    ]);

    log.debug(`Initialized candle request for ${symbol}`, null, "getCandles");
  });
}

/**
 * Fetches historical candlestick data for multiple symbols concurrently
 *
 * This function processes all symbols simultaneously, which can significantly
 * improve performance when fetching data for multiple symbols.
 *
 * @param params - Object containing connection, symbols, amount, and timeframe
 * @returns Promise resolving to array of candle arrays, one per symbol in the order provided
 *
 * @example
 * ```typescript
 * const candles = await getCandlesConcurrent({
 *   connection,
 *   symbols: ['FX:EURUSD', 'BINANCE:BTCUSDT', 'NASDAQ:AAPL'],
 *   amount: 100,
 *   timeframe: '1h'
 * });
 * ```
 */
export async function getCandlesConcurrent(
  params: GetCandlesParams,
): Promise<Candle[][]> {
  const { connection, symbols, amount, timeframe = 60 } = params;

  // Validate parameters
  CandleDataProcessor.validateParams(params);

  if (symbols.length === 0) {
    log.warn(
      "No symbols provided for getCandlesConcurrent",
      null,
      "getCandlesConcurrent",
    );
    return [];
  }

  log.info(
    `Fetching candles concurrently for ${symbols.length} symbols`,
    { symbols, amount, timeframe },
    "getCandlesConcurrent",
  );

  const batchSize = CandleDataProcessor.calculateBatchSize(amount);
  const validatedTimeframe = validateTimeframe(timeframe);
  const symbolStateManager = new SymbolStateManager();
  const chartSessionManager = new ChartSessionManager();
  const eventHandler = new CandleEventHandler(
    symbolStateManager,
    chartSessionManager,
    batchSize,
    amount,
  );

  const results: Candle[][] = [];
  let completedCount = 0;

  return new Promise<Candle[][]>((resolve, reject) => {
    // Initialize state for each symbol
    symbols.forEach((symbol) => {
      symbolStateManager.initializeSymbol(symbol);
    });

    const unsubscribe = connection.subscribe((event) => {
      try {
        if (event.name === "timescale_update") {
          eventHandler.handleTimescaleUpdate(event);
          return;
        }

        if (["series_completed", "symbol_error"].includes(event.name)) {
          const sessionId = event.params[0];
          const symbol = chartSessionManager.getSymbolForSession(sessionId);

          if (!symbol) return;

          const completed = eventHandler.handleSeriesEvent(
            event,
            connection,
            (symbolName, candles) => {
              // Store results in original order
              const originalIndex = symbols.indexOf(symbolName);
              results[originalIndex] = candles;

              completedCount++;
              log.debug(
                `Concurrent completion: ${symbolName} (${completedCount}/${symbols.length})`,
                null,
                "getCandlesConcurrent",
              );
            },
          );

          if (completed) {
            // Check if all symbols are completed
            if (completedCount === symbols.length) {
              unsubscribe();
              log.info(
                `Successfully fetched candles concurrently for all ${symbols.length} symbols`,
                null,
                "getCandlesConcurrent",
              );
              resolve(results);
            }
          }
          return;
        }
      } catch (error) {
        log.error(
          "Error processing concurrent candle data",
          error,
          "getCandlesConcurrent",
        );
        reject(
          ErrorFactory.dataParsingError(
            "unknown",
            error instanceof Error ? error : undefined,
          ),
        );
      }
    });

    // Send all requests concurrently
    symbols.forEach((symbol, index) => {
      const chartSession = CandleDataProcessor.generateChartSession(symbol);
      const symbolSession = CandleDataProcessor.generateSymbolSession(index);

      chartSessionManager.createChartSession(connection, symbol);
      chartSessionManager.resolveSymbol(
        connection,
        chartSession,
        symbol,
        symbolSession,
      );
      chartSessionManager.createSeries(
        connection,
        chartSession,
        `s${index}`,
        symbolSession,
        validatedTimeframe,
        batchSize,
      );
    });

    log.debug(
      `Initialized concurrent candle requests for ${symbols.length} symbols`,
      null,
      "getCandlesConcurrent",
    );
  });
}

/**
 * Configure the default logger
 *
 * @param config - Logger configuration options
 */
export function configureLogger(config: {
  level?: "trace" | "debug" | "info" | "warn" | "error" | "fatal";
  enableConsole?: boolean;
  enableTimestamp?: boolean;
  enableColors?: boolean;
  context?: string;
}): void {
  const { LogLevel, LogLevelUtils } = require("./utils/logger.js");

  const loggerConfig: any = {};

  if (config.level) {
    loggerConfig.level = LogLevelUtils.fromString(config.level);
  }
  if (config.enableConsole !== undefined) {
    loggerConfig.enableConsole = config.enableConsole;
  }
  if (config.enableTimestamp !== undefined) {
    loggerConfig.enableTimestamp = config.enableTimestamp;
  }
  if (config.enableColors !== undefined) {
    loggerConfig.enableColors = config.enableColors;
  }
  if (config.context) {
    loggerConfig.context = config.context;
  }

  const { log } = require("./utils/logger.js");
  log.configure(loggerConfig);
}

/**
 * Library version information
 */
export const VERSION = "0.0.8";

/**
 * Default configuration
 */
export const DEFAULT_CONFIG = {
  MAX_BATCH_SIZE: _MAX_BATCH_SIZE,
  CONNECTION_TIMEOUT: 10000,
  STREAM_POLL_INTERVAL: 50,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// Type re-exports for backward compatibility
export type {
  Candle as CandleData,
  TradingviewConnection as Connection,
  GetCandlesParams as CandlesParams,
};

/**
 * Utility function to validate library configuration
 */
export function validateConfig(): boolean {
  try {
    // Check if all required modules are available
    const requiredModules = [
      "./types/index.js",
      "./connection/websocket.js",
      "./utils/validation.js",
      "./data/candles.js",
      "./data/stream.js",
      "./utils/errors.js",
      "./utils/logger.js",
    ];

    // This would be used in a bundler context to ensure all modules are properly available
    return true;
  } catch (error) {
    log.error(
      "Library configuration validation failed",
      error,
      "validateConfig",
    );
    return false;
  }
}
