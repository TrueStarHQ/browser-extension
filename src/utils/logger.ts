import { SentryReporter } from './sentry-reporter';

class Logger {
  private readonly prefix = 'TrueStar:';
  private errorReporter: SentryReporter | null = null;

  constructor() {
    if (import.meta.env.VITE_SENTRY_DSN) {
      this.errorReporter = new SentryReporter(import.meta.env.VITE_SENTRY_DSN);
    }
  }

  info(message: string, ...args: unknown[]): void {
    console.info(`${this.prefix} ${message}`, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(`${this.prefix} ${message}`, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error(`${this.prefix} ${message}`, ...args);

    if (this.errorReporter) {
      const errorArg = args.find((arg) => arg instanceof Error);
      this.errorReporter.reportError(message, errorArg, { args });
    }
  }
}

export const log = new Logger();
