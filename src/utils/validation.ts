/**
 * Validation utilities for TradingView WebSocket API
 */

import { TradingviewTimeframe, FlexibleTimeframe } from "../types/index.js";

/**
 * Validates and normalizes timeframe input to TradingView API format
 * @param timeframe - The timeframe to validate (can be number or various string formats)
 * @returns Valid TradingView timeframe string
 * @throws Error if timeframe format is invalid
 */
export function validateTimeframe(timeframe: FlexibleTimeframe): TradingviewTimeframe {
  // If already a valid timeframe string, return as is
  const validTimeframes: TradingviewTimeframe[] = [
    "1",
    "3",
    "5",
    "15",
    "30",
    "45",
    "60",
    "120",
    "180",
    "240",
    "1D",
    "1W",
    "1M",
  ];

  if (
    typeof timeframe === "string" &&
    validTimeframes.includes(timeframe as TradingviewTimeframe)
  ) {
    return timeframe as TradingviewTimeframe;
  }

  // Convert numeric timeframes to string
  if (typeof timeframe === "number") {
    const timeframeStr = timeframe.toString();
    if (validTimeframes.includes(timeframeStr as TradingviewTimeframe)) {
      return timeframeStr as TradingviewTimeframe;
    }
  }

  // Convert common invalid string formats to valid ones
  if (typeof timeframe === "string") {
    const timeframeMap: Record<string, TradingviewTimeframe> = {
      "1m": "1",
      "3m": "3",
      "5m": "5",
      "15m": "15",
      "30m": "30",
      "45m": "45",
      "1h": "60",
      "2h": "120",
      "3h": "180",
      "4h": "240",
      "1d": "1D",
      "1w": "1W",
      "1M": "1M",
      D: "1D",
      W: "1W",
      M: "1M",
    };

    const normalized = timeframe.toLowerCase();
    if (timeframeMap[normalized]) {
      return timeframeMap[normalized];
    }
  }

  throw new Error(
    `Invalid timeframe: ${timeframe}. Valid timeframes are: ${validTimeframes.join(", ")}`,
  );
}

/**
 * Validates symbol format
 * @param symbol - The trading symbol to validate
 * @throws Error if symbol format is invalid
 */
export function validateSymbol(symbol: string): void {
  if (!symbol || typeof symbol !== "string") {
    throw new Error("Symbol must be a non-empty string");
  }

  if (symbol.trim() !== symbol) {
    throw new Error("Symbol cannot have leading or trailing whitespace");
  }

  // Basic symbol validation - allow common formats like FX:EURUSD, BINANCE:BTCUSDT, etc.
  const symbolPattern = /^[A-Z0-9:_.-]+$/i;
  if (!symbolPattern.test(symbol)) {
    throw new Error(`Invalid symbol format: ${symbol}`);
  }
}

/**
 * Validates amount parameter for candle requests
 * @param amount - The number of candles to request
 * @throws Error if amount is invalid
 */
export function validateAmount(amount?: number): void {
  if (amount !== undefined) {
    if (typeof amount !== "number") {
      throw new Error("Amount must be a number");
    }

    if (!Number.isInteger(amount)) {
      throw new Error("Amount must be an integer");
    }

    if (amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    if (amount > 10000) {
      throw new Error("Amount cannot exceed 10000 candles per request");
    }
  }
}

/**
 * Validates symbols array
 * @param symbols - Array of trading symbols
 * @throws Error if symbols array is invalid
 */
export function validateSymbols(symbols: string[]): void {
  if (!Array.isArray(symbols)) {
    throw new Error("Symbols must be an array");
  }

  if (symbols.length === 0) {
    throw new Error("At least one symbol must be provided");
  }

  if (symbols.length > 100) {
    throw new Error("Cannot request more than 100 symbols in a single request");
  }

  symbols.forEach((symbol, index) => {
    try {
      validateSymbol(symbol);
    } catch (error) {
      throw new Error(`Invalid symbol at index ${index}: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
}

/**
 * Validates connection options
 * @param options - Connection options object
 * @throws Error if options are invalid
 */
export function validateConnectionOptions(options: any): void {
  if (options && typeof options !== "object") {
    throw new Error("Connection options must be an object");
  }

  if (options?.sessionId && typeof options.sessionId !== "string") {
    throw new Error("Session ID must be a string");
  }

  if (options?.endpoint && typeof options.endpoint !== "string") {
    throw new Error("Endpoint must be a string");
  }
}
