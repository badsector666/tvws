/**
 * Candle data processing and retrieval utilities
 */

import {
  TradingviewConnection,
  GetCandlesParams,
  Candle,
  RawCandle,
  SymbolState
} from "../types/index.js";
import { validateTimeframe, validateSymbols, validateAmount } from "../utils/validation.js";
import { log } from "../utils/logger.js";
import { ErrorFactory } from "../utils/errors.js";

/**
 * Maximum batch size for data requests
 */
export const MAX_BATCH_SIZE = 5000;

/**
 * Common utilities for candle data processing
 */
export class CandleDataProcessor {
  /**
   * Converts raw candle data to processed candle format
   */
  static processCandle(rawCandle: RawCandle): Candle {
    return {
      timestamp: rawCandle.v[0],
      open: rawCandle.v[1],
      high: rawCandle.v[2],
      low: rawCandle.v[3],
      close: rawCandle.v[4],
      volume: rawCandle.v[5],
    };
  }

  /**
   * Processes an array of raw candles
   */
  static processCandles(rawCandles: RawCandle[]): Candle[] {
    return rawCandles.map(candle => this.processCandle(candle));
  }

  /**
   * Validates and normalizes request parameters
   */
  static validateParams(params: GetCandlesParams): void {
    if (!params.connection) {
      throw ErrorFactory.generic("Connection is required");
    }

    validateSymbols(params.symbols);
    validateAmount(params.amount);

    if (params.timeframe !== undefined) {
      validateTimeframe(params.timeframe);
    }
  }

  /**
   * Calculates batch size based on request parameters
   */
  static calculateBatchSize(amount?: number): number {
    return amount && amount < MAX_BATCH_SIZE ? amount : MAX_BATCH_SIZE;
  }

  /**
   * Generates a unique chart session ID
   */
  static generateChartSession(symbol?: string): string {
    const randomId = Math.random().toString(36).substring(2, 14);
    return symbol ? `cs_${symbol}_${randomId}` : `cs_${randomId}`;
  }

  /**
   * Generates a symbol session ID
   */
  static generateSymbolSession(index: number): string {
    return `sds_sym_${index}`;
  }

  /**
   * Finds the series data key in session data
   */
  static findSeriesKey(sessionData: any): string | null {
    return Object.keys(sessionData).find(
      (key) => key.startsWith("sds_") && sessionData[key].s
    ) || null;
  }

  /**
   * Filters new candles to avoid duplicates
   */
  static filterNewCandles(
    newCandles: RawCandle[],
    existingCandles: RawCandle[],
    batchSize: number
  ): RawCandle[] {
    if (newCandles.length <= batchSize) {
      return newCandles;
    }

    // Remove already received candles
    return newCandles.slice(0, -existingCandles.length);
  }

  /**
   * Checks if more data should be requested
   */
  static shouldRequestMoreData(
    loadedCount: number,
    requestedAmount?: number
  ): boolean {
    return (
      loadedCount > 0 &&
      loadedCount % MAX_BATCH_SIZE === 0 &&
      (!requestedAmount || loadedCount < requestedAmount)
    );
  }

  /**
   * Trims candles array to requested amount
   */
  static trimToAmount(candles: Candle[], amount?: number): Candle[] {
    return amount ? candles.slice(0, amount) : candles;
  }
}

/**
 * Manages symbol state during data collection
 */
export class SymbolStateManager {
  private states: Map<string, SymbolState> = new Map();

  /**
   * Initializes state for a symbol
   */
  initializeSymbol(symbol: string): void {
    this.states.set(symbol, {
      candles: [],
      completed: false,
      error: false,
    });
  }

  /**
   * Gets state for a symbol
   */
  getSymbolState(symbol: string): SymbolState | undefined {
    return this.states.get(symbol);
  }

  /**
   * Updates candles for a symbol
   */
  updateSymbolCandles(symbol: string, newCandles: RawCandle[]): void {
    const state = this.states.get(symbol);
    if (state && !state.completed) {
      state.candles = newCandles.concat(state.candles);
    }
  }

  /**
   * Marks symbol as completed with optional error
   */
  markSymbolCompleted(symbol: string, hasError: boolean = false): void {
    const state = this.states.get(symbol);
    if (state) {
      state.completed = true;
      state.error = hasError;
    }
  }

  /**
   * Gets processed candles for a symbol
   */
  getProcessedCandles(symbol: string, amount?: number): Candle[] {
    const state = this.states.get(symbol);
    if (!state) return [];

    let finalCandles = state.candles;
    if (amount) {
      finalCandles = finalCandles.slice(0, amount);
    }

    return CandleDataProcessor.processCandles(finalCandles);
  }

  /**
   * Checks if all symbols are completed
   */
  allSymbolsCompleted(symbols: string[]): boolean {
    return symbols.every(symbol => {
      const state = this.states.get(symbol);
      return state?.completed === true;
    });
  }

  /**
   * Gets count of completed symbols
   */
  getCompletedCount(symbols: string[]): number {
    return symbols.filter(symbol => {
      const state = this.states.get(symbol);
      return state?.completed === true;
    }).length;
  }

  /**
   * Clears all symbol states
   */
  clearStates(): void {
    this.states.clear();
  }
}

/**
 * Manages TradingView chart sessions and requests
 */
export class ChartSessionManager {
  private sessionMap: Map<string, string> = new Map(); // session -> symbol

  /**
   * Creates a new chart session
   */
  createChartSession(connection: TradingviewConnection, symbol: string): string {
    const chartSession = CandleDataProcessor.generateChartSession(symbol);
    this.sessionMap.set(chartSession, symbol);

    connection.send("chart_create_session", [chartSession, ""]);
    log.debug(`Created chart session: ${chartSession} for symbol: ${symbol}`, null, "ChartSession");

    return chartSession;
  }

  /**
   * Resolves a symbol in a chart session
   */
  resolveSymbol(
    connection: TradingviewConnection,
    chartSession: string,
    symbol: string,
    symbolSession: string
  ): void {
    connection.send("resolve_symbol", [
      chartSession,
      symbolSession,
      "=" + JSON.stringify({ symbol, adjustment: "splits" }),
    ]);
    log.debug(`Resolving symbol: ${symbol} in session: ${chartSession}`, null, "ChartSession");
  }

  /**
   * Creates a data series for a chart
   */
  createSeries(
    connection: TradingviewConnection,
    chartSession: string,
    seriesId: string,
    symbolSession: string,
    timeframe: string,
    batchSize: number
  ): void {
    connection.send("create_series", [
      chartSession,
      "sds_1",
      seriesId,
      symbolSession,
      timeframe,
      batchSize,
      "",
    ]);
    log.debug(`Created series: ${seriesId} for timeframe: ${timeframe}`, null, "ChartSession");
  }

  /**
   * Modifies an existing series
   */
  modifySeries(
    connection: TradingviewConnection,
    chartSession: string,
    seriesId: string,
    symbolSession: string,
    timeframe: string
  ): void {
    connection.send("modify_series", [
      chartSession,
      "sds_1",
      seriesId,
      symbolSession,
      timeframe,
      "",
    ]);
    log.debug(`Modified series: ${seriesId} for timeframe: ${timeframe}`, null, "ChartSession");
  }

  /**
   * Requests more data for a series
   */
  requestMoreData(
    connection: TradingviewConnection,
    chartSession: string,
    batchSize: number
  ): void {
    connection.send("request_more_data", [chartSession, "sds_1", batchSize]);
    log.debug(`Requested more data for session: ${chartSession}`, null, "ChartSession");
  }

  /**
   * Gets symbol for a chart session
   */
  getSymbolForSession(chartSession: string): string | undefined {
    return this.sessionMap.get(chartSession);
  }

  /**
   * Clears all session mappings
   */
  clearSessions(): void {
    this.sessionMap.clear();
  }
}

/**
 * Handles candle data events from WebSocket
 */
export class CandleEventHandler {
  private symbolStateManager: SymbolStateManager;
  private chartSessionManager: ChartSessionManager;
  private batchSize: number;
  private requestedAmount?: number;

  constructor(
    symbolStateManager: SymbolStateManager,
    chartSessionManager: ChartSessionManager,
    batchSize: number,
    requestedAmount?: number
  ) {
    this.symbolStateManager = symbolStateManager;
    this.chartSessionManager = chartSessionManager;
    this.batchSize = batchSize;
    this.requestedAmount = requestedAmount;
  }

  /**
   * Handles timescale update events
   */
  handleTimescaleUpdate(event: any): void {
    const sessionData = event.params[1];
    const sessionId = event.params[0];
    const symbol = this.chartSessionManager.getSymbolForSession(sessionId);

    if (!symbol) return;

    const state = this.symbolStateManager.getSymbolState(symbol);
    if (!state || state.completed) return;

    const seriesKey = CandleDataProcessor.findSeriesKey(sessionData);
    if (seriesKey && sessionData[seriesKey]?.s) {
      let newCandles: RawCandle[] = sessionData[seriesKey].s;
      newCandles = CandleDataProcessor.filterNewCandles(
        newCandles,
        state.candles,
        this.batchSize
      );
      this.symbolStateManager.updateSymbolCandles(symbol, newCandles);

      log.trace(`Received ${newCandles.length} candles for ${symbol}`, null, "CandleEvent");
    }
  }

  /**
   * Handles series completion or error events
   */
  handleSeriesEvent(
    event: any,
    connection: TradingviewConnection,
    onSymbolCompleted?: (symbol: string, candles: Candle[]) => void
  ): boolean {
    const sessionId = event.params[0];
    const symbol = this.chartSessionManager.getSymbolForSession(sessionId);

    if (!symbol) return false;

    const state = this.symbolStateManager.getSymbolState(symbol);
    if (!state || state.completed) return false;

    const loadedCount = state.candles.length;
    if (CandleDataProcessor.shouldRequestMoreData(loadedCount, this.requestedAmount)) {
      this.chartSessionManager.requestMoreData(connection, sessionId, this.batchSize);
      return false; // Not completed yet
    }

    // Mark as completed
    const hasError = event.name === "symbol_error";
    this.symbolStateManager.markSymbolCompleted(symbol, hasError);

    if (onSymbolCompleted) {
      const processedCandles = this.symbolStateManager.getProcessedCandles(
        symbol,
        this.requestedAmount
      );
      onSymbolCompleted(symbol, processedCandles);
    }

    log.debug(`Symbol ${symbol} ${hasError ? 'failed' : 'completed'} with ${state.candles.length} candles`, null, "CandleEvent");
    return true;
  }
}
