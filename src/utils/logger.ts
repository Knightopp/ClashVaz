export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  details?: any;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 5000;

  public log(level: LogLevel, category: string, message: string, details?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      details
    };
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    const prefix = `[${entry.timestamp}] [${level}] [${category}]`;
    if (level === 'ERROR') {
      console.error(`${prefix} ${message}`, details ?? '');
    } else if (level === 'WARN') {
      console.warn(`${prefix} ${message}`, details ?? '');
    } else if (level === 'INFO') {
      console.log(`${prefix} ${message}`, details ?? '');
    } else {
      // DEBUG
      if (process.env.DEBUG) {
        console.log(`${prefix} ${message}`, details ?? '');
      }
    }
  }

  public info(category: string, message: string, details?: any): void {
    this.log('INFO', category, message, details);
  }

  public warn(category: string, message: string, details?: any): void {
    this.log('WARN', category, message, details);
  }

  public error(category: string, message: string, details?: any): void {
    this.log('ERROR', category, message, details);
  }

  public debug(category: string, message: string, details?: any): void {
    this.log('DEBUG', category, message, details);
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clear(): void {
    this.logs = [];
  }
}

export const logger = new Logger();
