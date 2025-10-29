/**
 * Configurable logging system for TradingView WebSocket API
 */

/**
 * Log levels in order of severity
 */
export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5
}

/**
 * Log entry interface
 */
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
}

/**
 * Logger configuration interface
 */
export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableTimestamp: boolean;
  enableColors: boolean;
  context?: string;
  customHandler?: (entry: LogEntry) => void;
}

/**
 * Default logger configuration
 */
const DEFAULT_CONFIG: LoggerConfig = {
  level: LogLevel.INFO,
  enableConsole: true,
  enableTimestamp: true,
  enableColors: true,
  context: undefined,
  customHandler: undefined
};

/**
 * ANSI color codes for console output
 */
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

/**
 * Logger class for structured logging
 */
export class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Updates the logger configuration
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Gets the current log level
   */
  getLevel(): LogLevel {
    return this.config.level;
  }

  /**
   * Sets the log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Checks if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  /**
   * Formats a log entry for console output
   */
  private formatLogEntry(entry: LogEntry): string {
    const parts: string[] = [];

    // Add timestamp
    if (this.config.enableTimestamp) {
      const timestamp = entry.timestamp.toISOString();
      parts.push(`[${timestamp}]`);
    }

    // Add context if specified
    if (this.config.context || entry.context) {
      const context = entry.context || this.config.context;
      parts.push(`[${context}]`);
    }

    // Add log level
    const levelName = LogLevel[entry.level];
    parts.push(`[${levelName}]`);

    // Add message
    parts.push(entry.message);

    // Combine parts
    let formatted = parts.join(' ');

    // Add colors if enabled
    if (this.config.enableColors) {
      formatted = this.colorize(formatted, entry.level);
    }

    return formatted;
  }

  /**
   * Applies colors to log output based on level
   */
  private colorize(message: string, level: LogLevel): string {
    if (!this.config.enableColors) {
      return message;
    }

    switch (level) {
      case LogLevel.TRACE:
        return `${COLORS.gray}${message}${COLORS.reset}`;
      case LogLevel.DEBUG:
        return `${COLORS.cyan}${message}${COLORS.reset}`;
      case LogLevel.INFO:
        return `${COLORS.green}${message}${COLORS.reset}`;
      case LogLevel.WARN:
        return `${COLORS.yellow}${message}${COLORS.reset}`;
      case LogLevel.ERROR:
        return `${COLORS.red}${message}${COLORS.reset}`;
      case LogLevel.FATAL:
        return `${COLORS.red}${COLORS.bright}${message}${COLORS.reset}`;
      default:
        return message;
    }
  }

  /**
   * Creates a log entry and outputs it
   */
  private log(level: LogLevel, message: string, data?: any, context?: string): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context: context || this.config.context,
      data
    };

    // Output to console
    if (this.config.enableConsole) {
      const formatted = this.formatLogEntry(entry);

      switch (level) {
        case LogLevel.TRACE:
        case LogLevel.DEBUG:
          console.debug(formatted);
          break;
        case LogLevel.INFO:
          console.info(formatted);
          break;
        case LogLevel.WARN:
          console.warn(formatted);
          break;
        case LogLevel.ERROR:
        case LogLevel.FATAL:
          console.error(formatted);
          break;
        default:
          console.log(formatted);
      }
    }

    // Call custom handler if provided
    if (this.config.customHandler) {
      try {
        this.config.customHandler(entry);
      } catch (error) {
        console.error('Error in custom log handler:', error);
      }
    }
  }

  /**
   * Log trace level message
   */
  trace(message: string, data?: any, context?: string): void {
    this.log(LogLevel.TRACE, message, data, context);
  }

  /**
   * Log debug level message
   */
  debug(message: string, data?: any, context?: string): void {
    this.log(LogLevel.DEBUG, message, data, context);
  }

  /**
   * Log info level message
   */
  info(message: string, data?: any, context?: string): void {
    this.log(LogLevel.INFO, message, data, context);
  }

  /**
   * Log warning level message
   */
  warn(message: string, data?: any, context?: string): void {
    this.log(LogLevel.WARN, message, data, context);
  }

  /**
   * Log error level message
   */
  error(message: string, data?: any, context?: string): void {
    this.log(LogLevel.ERROR, message, data, context);
  }

  /**
   * Log fatal level message
   */
  fatal(message: string, data?: any, context?: string): void {
    this.log(LogLevel.FATAL, message, data, context);
  }

  /**
   * Creates a child logger with additional context
   */
  child(context: string, additionalConfig: Partial<LoggerConfig> = {}): Logger {
    const childConfig = {
      ...this.config,
      ...additionalConfig,
      context: this.config.context ? `${this.config.context}:${context}` : context
    };
    return new Logger(childConfig);
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger();

/**
 * Convenience functions for using the default logger
 */
export const log = {
  trace: (message: string, data?: any, context?: string) => logger.trace(message, data, context),
  debug: (message: string, data?: any, context?: string) => logger.debug(message, data, context),
  info: (message: string, data?: any, context?: string) => logger.info(message, data, context),
  warn: (message: string, data?: any, context?: string) => logger.warn(message, data, context),
  error: (message: string, data?: any, context?: string) => logger.error(message, data, context),
  fatal: (message: string, data?: any, context?: string) => logger.fatal(message, data, context),
  configure: (config: Partial<LoggerConfig>) => logger.configure(config),
  setLevel: (level: LogLevel) => logger.setLevel(level),
  getLevel: () => logger.getLevel(),
  child: (context: string, config?: Partial<LoggerConfig>) => logger.child(context, config)
};

/**
 * Utility functions for log level management
 */
export const LogLevelUtils = {
  /**
   * Parses a string log level name to LogLevel enum
   */
  fromString: (level: string): LogLevel => {
    const upperLevel = level.toUpperCase();
    if (upperLevel in LogLevel) {
      return LogLevel[upperLevel as keyof typeof LogLevel];
    }
    throw new Error(`Invalid log level: ${level}. Valid levels are: ${Object.keys(LogLevel).join(', ')}`);
  },

  /**
   * Converts LogLevel enum to string
   */
  toString: (level: LogLevel): string => {
    return LogLevel[level];
  },

  /**
   * Gets all available log levels
   */
  getAllLevels: (): string[] => {
    return Object.keys(LogLevel).filter(key => isNaN(Number(key)));
  }
};
