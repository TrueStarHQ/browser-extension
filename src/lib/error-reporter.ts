import { preferencesManager } from './preferences';
import * as Sentry from '@sentry/svelte';

interface ErrorReport {
  message: string;
  level: 'error' | 'warning';
  context?: Record<string, unknown>;
  tags?: Record<string, string>;
}

export class ErrorReporter {
  private isInitialized = false;

  constructor(private dsn: string) {
    this.checkAndInitialize();
  }

  private async checkAndInitialize(): Promise<void> {
    if (
      !preferencesManager.isErrorLoggingEnabled() ||
      this.isInitialized ||
      !this.dsn
    ) {
      return;
    }

    // Filter out integrations that pollute global state
    const integrations = Sentry.getDefaultIntegrations({}).filter(
      (integration) =>
        !['BrowserApiErrors', 'Breadcrumbs', 'GlobalHandlers'].includes(
          integration.name
        )
    );

    const client = new Sentry.BrowserClient({
      dsn: this.dsn,
      environment: import.meta.env.VITE_ENVIRONMENT || 'dev',
      transport: Sentry.makeFetchTransport,
      stackParser: Sentry.defaultStackParser,
      integrations: integrations,
      sendDefaultPii: false,
    });

    const scope = new Sentry.Scope();
    scope.setClient(client);
    client.init();

    this.isInitialized = true;
  }

  async report(error: ErrorReport): Promise<void> {
    if (!preferencesManager.isErrorLoggingEnabled()) {
      return;
    }

    // Ensure Sentry is initialized
    await this.checkAndInitialize();

    Sentry.captureException(new Error(error.message), {
      level: error.level,
      tags: error.tags,
      contexts: {
        custom: error.context,
      },
    });
  }

  async reportError(
    message: string,
    _error?: unknown,
    context?: Record<string, unknown>
  ): Promise<void> {
    await this.report({
      message: _error instanceof Error ? _error.message : message,
      level: 'error',
      context: {
        ...context,
        originalMessage: message,
        errorType: _error?.constructor?.name,
      },
    });
  }

  async reportWarning(
    message: string,
    context?: Record<string, unknown>
  ): Promise<void> {
    await this.report({
      message,
      level: 'warning',
      context,
    });
  }
}
