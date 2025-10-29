/**
 * Centralized error handling for TradingView WebSocket API
 */

/**
 * Base error class for all TradingView related errors
 */
export class TradingViewError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = "TradingViewError";

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TradingViewError);
    }
  }
}

/**
 * Connection related errors
 */
export class ConnectionError extends TradingViewError {
  constructor(message: string, public readonly endpoint?: string) {
    super(message, "CONNECTION_ERROR");
    this.name = "ConnectionError";
  }
}

/**
 * Authentication related errors
 */
export class AuthenticationError extends TradingViewError {
  constructor(message: string) {
    super(message, "AUTH_ERROR");
    this.name = "AuthenticationError";
  }
}

/**
 * Data retrieval related errors
 */
export class DataError extends TradingViewError {
  constructor(message: string, public readonly symbol?: string) {
    super(message, "DATA_ERROR");
    this.name = "DataError";
  }
}

/**
 * Validation related errors
 */
export class ValidationError extends TradingViewError {
  constructor(message: string, public readonly field?: string) {
    super(message, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

/**
 * Protocol related errors
 */
export class ProtocolError extends TradingViewError {
  constructor(message: string, public readonly payload?: any) {
    super(message, "PROTOCOL_ERROR");
    this.name = "ProtocolError";
  }
}

/**
 * Timeout related errors
 */
export class TimeoutError extends TradingViewError {
  constructor(message: string, public readonly timeout?: number) {
    super(message, "TIMEOUT_ERROR");
    this.name = "TimeoutError";
  }
}

/**
 * Error factory functions for common error scenarios
 */
export const ErrorFactory = {
  /**
   * Creates a connection timeout error
   */
  connectionTimeout: (timeout: number) =>
    new TimeoutError(`Connection timeout after ${timeout}ms`, timeout),

  /**
   * Creates a connection failed error
   */
  connectionFailed: (endpoint: string, cause?: Error) =>
    new ConnectionError(`Failed to connect to endpoint: ${endpoint}${cause ? ` (${cause.message})` : ''}`, endpoint),

  /**
   * Creates an authentication failed error
   */
  authenticationFailed: (reason?: string) =>
    new AuthenticationError(`Authentication failed${reason ? `: ${reason}` : ''}`),

  /**
   * Creates a symbol not found error
   */
  symbolNotFound: (symbol: string) =>
    new DataError(`Symbol not found: ${symbol}`, symbol),

  /**
   * Creates an invalid symbol error
   */
  invalidSymbol: (symbol: string, reason?: string) =>
    new ValidationError(`Invalid symbol: ${symbol}${reason ? ` (${reason})` : ''}`, 'symbol'),

  /**
   * Creates an invalid timeframe error
   */
  invalidTimeframe: (timeframe: any, validTimeframes: string[]) =>
    new ValidationError(`Invalid timeframe: ${timeframe}. Valid timeframes are: ${validTimeframes.join(", ")}`, 'timeframe'),

  /**
   * Creates an invalid amount error
   */
  invalidAmount: (amount: any, reason?: string) =>
    new ValidationError(`Invalid amount: ${amount}${reason ? ` (${reason})` : ''}`, 'amount'),

  /**
   * Creates an invalid symbols array error
   */
  invalidSymbolsArray: (reason: string) =>
    new ValidationError(`Invalid symbols array: ${reason}`, 'symbols'),

  /**
   * Creates a data parsing error
   */
  dataParsingError: (symbol: string, cause?: Error) =>
    new DataError(`Failed to parse data for symbol: ${symbol}${cause ? ` (${cause.message})` : ''}`, symbol),

  /**
   * Creates a protocol error
   */
  protocolError: (message: string, payload?: any) =>
    new ProtocolError(message, payload),

  /**
   * Creates a generic TradingView error
   */
  generic: (message: string, code?: string) =>
    new TradingViewError(message, code),
};

/**
 * Error handler utility functions
 */
export const ErrorHandler = {
  /**
   * Determines if an error is retryable
   */
  isRetryable: (error: Error): boolean => {
    if (error instanceof ConnectionError) return true;
    if (error instanceof TimeoutError) return true;
    if (error instanceof TradingViewError) {
      return ['CONNECTION_ERROR', 'TIMEOUT_ERROR'].includes(error.code || '');
    }
    return false;
  },

  /**
   * Extracts a user-friendly error message
   */
  getUserMessage: (error: Error): string => {
    if (error instanceof ValidationError) {
      return `Validation error: ${error.message}`;
    }
    if (error instanceof ConnectionError) {
      return `Connection error: ${error.message}`;
    }
    if (error instanceof AuthenticationError) {
      return `Authentication error: ${error.message}`;
    }
    if (error instanceof DataError) {
      return `Data error: ${error.message}`;
    }
    return `Error: ${error.message}`;
  },

  /**
   * Logs an error with appropriate context
   */
  log: (error: Error, context?: string) => {
    const message = context ? `[${context}] ${error.message}` : error.message;

    if (error instanceof ValidationError) {
      console.warn(message);
    } else if (error instanceof ConnectionError || error instanceof TimeoutError) {
      console.error(message);
    } else {
      console.error(message);
    }
  }
};
