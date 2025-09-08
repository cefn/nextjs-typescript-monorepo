/**
 * Names of log levels a Logger will output. More verbose logging calls than the
 * specified level should be ignored and not sent to any transport.
 */
export const LOG_LEVELS = ["error", "warn", "info", "debug"] as const;

/**
 * Utility function to interrogate log-level ordering. Intended for calculations
 * if a named level includes another level or not. Enables code to skip the
 * complex reporting that will be ignored anyway.
 */
export function levelIncludes(messageLevel: LogLevel, loggerLevel: LogLevel) {
  for (const level of LOG_LEVELS) {
    if (level === messageLevel) {
      return true;
    }
    if (level === loggerLevel) {
      break;
    }
  }
  return false;
}

/** Supported log level names */
export type LogLevel = (typeof LOG_LEVELS)[number];

/**
 * Generic logger capabilities to report on
 * events, errors. Reference implementation is
 * `@myrepo/logger-winston`
 */
export interface Logger {
  /**
   * Current maximum verbosity. More verbose calls than this level will be
   * ignored. {@link LOG_LEVELS} {@link levelIncludes}
   */
  level: LogLevel;

  /** Convenience method to check if a level is currently being logged */
  isLogged(level: LogLevel): boolean;

  /** Finalises this logger, tearing down any resources. */
  destroy(): unknown;

  /** Detailed logging not normally suited for production */
  debug(message: string): void;
  /** Routine logging suited for production */
  info(message: string): void;
  /** Log an event that may contribute to failure. */
  warn(message: string): void;
  /** Log a failure that requires attention. */
  error(message: string): void;
}
