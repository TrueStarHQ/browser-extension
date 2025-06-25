import { ErrorReporter } from './error-reporter';

class Logger {
  private readonly prefix = 'TrueStar:';
  private errorReporter: ErrorReporter | null = null;

  constructor() {
    // Only create error reporter if DSN is available
    if (import.meta.env.VITE_SENTRY_DSN) {
      this.errorReporter = new ErrorReporter(import.meta.env.VITE_SENTRY_DSN);
    }
  }

  info(message: string, ...args: unknown[]): void {
    console.info(`${this.prefix} ${message}`, ...args);
  }

  warning(message: string, ...args: unknown[]): void {
    console.warn(`${this.prefix} ${message}`, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error(`${this.prefix} ${message}`, ...args);

    // Report errors to error reporter (Sentry) if available
    if (this.errorReporter) {
      const errorArg = args.find((arg) => arg instanceof Error);
      this.errorReporter.reportError(message, errorArg, { args });
    }
  }
}

export const log = new Logger();
