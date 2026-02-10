import { config } from '../config/environment';

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

class Logger {
  private log(level: LogLevel, message: string, meta?: unknown) {
    const timestamp = new Date().toISOString();
    const logMessage = {
      timestamp,
      level,
      message,
      ...(meta && { meta }),
    };

    if (config.nodeEnv === 'development') {
      console.log(JSON.stringify(logMessage, null, 2));
    } else {
      console.log(JSON.stringify(logMessage));
    }
  }

  error(message: string, meta?: unknown) {
    this.log(LogLevel.ERROR, message, meta);
  }

  warn(message: string, meta?: unknown) {
    this.log(LogLevel.WARN, message, meta);
  }

  info(message: string, meta?: unknown) {
    this.log(LogLevel.INFO, message, meta);
  }

  debug(message: string, meta?: unknown) {
    if (config.nodeEnv === 'development') {
      this.log(LogLevel.DEBUG, message, meta);
    }
  }
}

export const logger = new Logger();
