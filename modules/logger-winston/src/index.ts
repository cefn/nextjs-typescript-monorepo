import {
  levelIncludes,
  type Logger,
  type LogLevel,
} from "@myrepo/common";
import winston, { LoggerOptions, transport } from "winston";

export type { LoggerOptions, transport } from "winston";

/**
 * Creates a logger that fulfils the interface of {@link Logger} backed by the
 * {@link https://www.npmjs.com/package/winston winston} package.
 *
 * Passes through winston options to specialise the logger if needed.
 *
 * Otherwise it provides the required defaults for formatting and transport to
 * fulfil a simple console logger.
 */
export function createLogger(
  options: Partial<LoggerOptions> & {
    level: LogLevel;
    transports?: transport[];
  } = {
    level: "info",
  },
): Logger {
  const {
    transports = [new winston.transports.Console()],
    format = winston.format.simple(),
  } = options;

  const winstonLogger = winston.createLogger({
    ...options,
    ...{ transports },
    ...{ format },
  });

  /** Narrow the `level` string to only allow LogLevel */
  type ExtendedWinstonLogger = typeof winstonLogger & { level: LogLevel };

  return Object.assign(winstonLogger as ExtendedWinstonLogger, {
    isLogged(this: ExtendedWinstonLogger, messageLevel: LogLevel) {
      const { level } = this;
      return levelIncludes(messageLevel, level);
    },
    destroy() {
      return new Promise((resolve) => {
        winstonLogger.once("finish", resolve);
        winstonLogger.end();
      });
    },
  });
}
