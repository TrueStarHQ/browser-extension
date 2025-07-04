import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SentryReporter } from './sentry-reporter';

// Minimal mocks - only what's absolutely necessary
vi.mock('@sentry/svelte');
vi.mock('./user-preferences');

import * as Sentry from '@sentry/svelte';

import { preferences } from './user-preferences';

describe('SentryReporter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_ENVIRONMENT', 'test');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // Start with the simplest possible test
  it('can be created with a DSN', () => {
    const reporter = new SentryReporter('https://example@sentry.io/123');
    expect(reporter).toBeDefined();
  });

  it('can be created without a DSN', () => {
    const reporter = new SentryReporter('');
    expect(reporter).toBeDefined();
  });

  describe('when error logging is enabled', () => {
    beforeEach(() => {
      vi.mocked(preferences.isErrorLoggingEnabled).mockReturnValue(true);
      vi.mocked(Sentry.captureException).mockImplementation(
        () => 'event-id' as any
      );
      // Mock the minimum needed for initialization
      vi.mocked(Sentry.getDefaultIntegrations).mockReturnValue([]);
      vi.mocked(Sentry.BrowserClient).mockImplementation(
        () => ({ init: vi.fn() }) as any
      );
      vi.mocked(Sentry.Scope).mockImplementation(
        () => ({ setClient: vi.fn() }) as any
      );
    });

    it('reports a simple error', async () => {
      const reporter = new SentryReporter('https://example@sentry.io/123');

      await reporter.report({
        message: 'Something went wrong',
        level: 'error',
      });

      expect(Sentry.captureException).toHaveBeenCalled();
    });

    it('reports a simple warning', async () => {
      const reporter = new SentryReporter('https://example@sentry.io/123');

      await reporter.report({
        message: 'This is a warning',
        level: 'warning',
      });

      expect(Sentry.captureException).toHaveBeenCalled();
    });

    it('includes the error message', async () => {
      const reporter = new SentryReporter('https://example@sentry.io/123');

      await reporter.report({
        message: 'Specific error message',
        level: 'error',
      });

      const capturedError = vi.mocked(Sentry.captureException).mock
        .calls[0]?.[0];
      expect(capturedError).toBeInstanceOf(Error);
      expect((capturedError as Error).message).toBe('Specific error message');
    });

    it('includes the error level', async () => {
      const reporter = new SentryReporter('https://example@sentry.io/123');

      await reporter.report({
        message: 'Error',
        level: 'error',
      });

      const options = vi.mocked(Sentry.captureException).mock.calls[0]?.[1];
      expect((options as any).level).toBe('error');
    });

    it('includes the warning level', async () => {
      const reporter = new SentryReporter('https://example@sentry.io/123');

      await reporter.report({
        message: 'Warning',
        level: 'warning',
      });

      const options = vi.mocked(Sentry.captureException).mock.calls[0]?.[1];
      expect((options as any).level).toBe('warning');
    });

    it('can report without additional context', async () => {
      const reporter = new SentryReporter('https://example@sentry.io/123');

      await reporter.report({
        message: 'Simple error',
        level: 'error',
      });

      const options = vi.mocked(Sentry.captureException).mock.calls[0]?.[1];
      expect((options as any).contexts.custom).toBeUndefined();
      expect((options as any).tags).toBeUndefined();
    });

    it('includes context when provided', async () => {
      const reporter = new SentryReporter('https://example@sentry.io/123');

      await reporter.report({
        message: 'Error with context',
        level: 'error',
        context: { userId: '123' },
      });

      const options = vi.mocked(Sentry.captureException).mock.calls[0]?.[1];
      expect((options as any).contexts.custom).toEqual({ userId: '123' });
    });

    it('includes tags when provided', async () => {
      const reporter = new SentryReporter('https://example@sentry.io/123');

      await reporter.report({
        message: 'Error with tags',
        level: 'error',
        tags: { component: 'header' },
      });

      const options = vi.mocked(Sentry.captureException).mock.calls[0]?.[1];
      expect((options as any).tags).toEqual({ component: 'header' });
    });
  });

  describe('when error logging is disabled', () => {
    beforeEach(() => {
      vi.mocked(preferences.isErrorLoggingEnabled).mockReturnValue(
        false
      );
      vi.mocked(Sentry.captureException).mockImplementation(
        () => 'event-id' as any
      );
    });

    it('does not report errors', async () => {
      const reporter = new SentryReporter('https://example@sentry.io/123');

      await reporter.report({
        message: 'This should not be reported',
        level: 'error',
      });

      expect(Sentry.captureException).not.toHaveBeenCalled();
    });

    it('does not report warnings', async () => {
      const reporter = new SentryReporter('https://example@sentry.io/123');

      await reporter.report({
        message: 'This warning should not be reported',
        level: 'warning',
      });

      expect(Sentry.captureException).not.toHaveBeenCalled();
    });
  });

  describe('when DSN is not provided', () => {
    beforeEach(() => {
      vi.mocked(preferences.isErrorLoggingEnabled).mockReturnValue(true);
      vi.mocked(Sentry.BrowserClient).mockImplementation(
        () => ({ init: vi.fn() }) as any
      );
    });

    it('does not initialize Sentry', () => {
      new SentryReporter('');

      expect(Sentry.BrowserClient).not.toHaveBeenCalled();
    });
  });

  describe('convenience methods', () => {
    beforeEach(() => {
      vi.mocked(preferences.isErrorLoggingEnabled).mockReturnValue(true);
      vi.mocked(Sentry.captureException).mockImplementation(
        () => 'event-id' as any
      );
      // Mock the minimum needed for initialization
      vi.mocked(Sentry.getDefaultIntegrations).mockReturnValue([]);
      vi.mocked(Sentry.BrowserClient).mockImplementation(
        () => ({ init: vi.fn() }) as any
      );
      vi.mocked(Sentry.Scope).mockImplementation(
        () => ({ setClient: vi.fn() }) as any
      );
    });

    describe('reportError', () => {
      it('reports with error level', async () => {
        const reporter = new SentryReporter('https://example@sentry.io/123');

        await reporter.reportError('Something failed');

        const options = vi.mocked(Sentry.captureException).mock.calls[0]?.[1];
        expect((options as any).level).toBe('error');
      });

      it('uses the provided message', async () => {
        const reporter = new SentryReporter('https://example@sentry.io/123');

        await reporter.reportError('Custom error message');

        const error = vi.mocked(Sentry.captureException).mock.calls[0]?.[0];
        expect((error as Error).message).toBe('Custom error message');
      });

      it('includes additional context', async () => {
        const reporter = new SentryReporter('https://example@sentry.io/123');

        await reporter.reportError('Error', undefined, { page: 'home' });

        const options = vi.mocked(Sentry.captureException).mock.calls[0]?.[1];
        expect((options as any).contexts.custom.page).toBe('home');
      });

      it('preserves the original message in context', async () => {
        const reporter = new SentryReporter('https://example@sentry.io/123');

        await reporter.reportError(
          'User facing message',
          new Error('Technical error')
        );

        const options = vi.mocked(Sentry.captureException).mock.calls[0]?.[1];
        expect((options as any).contexts.custom.originalMessage).toBe(
          'User facing message'
        );
      });

      it('uses error message when error object is provided', async () => {
        const reporter = new SentryReporter('https://example@sentry.io/123');
        const actualError = new Error('Technical details');

        await reporter.reportError('User message', actualError);

        const error = vi.mocked(Sentry.captureException).mock.calls[0]?.[0];
        expect((error as Error).message).toBe('Technical details');
      });
    });

    describe('reportWarning', () => {
      it('reports with warning level', async () => {
        const reporter = new SentryReporter('https://example@sentry.io/123');

        await reporter.reportWarning('This is concerning');

        const options = vi.mocked(Sentry.captureException).mock.calls[0]?.[1];
        expect((options as any).level).toBe('warning');
      });

      it('uses the provided message', async () => {
        const reporter = new SentryReporter('https://example@sentry.io/123');

        await reporter.reportWarning('Specific warning');

        const error = vi.mocked(Sentry.captureException).mock.calls[0]?.[0];
        expect((error as Error).message).toBe('Specific warning');
      });

      it('includes additional context', async () => {
        const reporter = new SentryReporter('https://example@sentry.io/123');

        await reporter.reportWarning('Warning', { threshold: 0.8 });

        const options = vi.mocked(Sentry.captureException).mock.calls[0]?.[1];
        expect((options as any).contexts.custom.threshold).toBe(0.8);
      });
    });
  });

  describe('initialization behavior', () => {
    beforeEach(() => {
      vi.mocked(preferences.isErrorLoggingEnabled).mockReturnValue(true);
      vi.mocked(Sentry.getDefaultIntegrations).mockReturnValue([
        { name: 'BrowserApiErrors' },
        { name: 'Breadcrumbs' },
        { name: 'GlobalHandlers' },
        { name: 'SafeIntegration' },
      ]);
      vi.mocked(Sentry.BrowserClient).mockImplementation(
        () => ({ init: vi.fn() }) as any
      );
      vi.mocked(Sentry.Scope).mockImplementation(
        () => ({ setClient: vi.fn() }) as any
      );
    });

    it('initializes only once even with multiple reports', async () => {
      const reporter = new SentryReporter('https://example@sentry.io/123');

      await reporter.report({ message: 'First', level: 'error' });
      await reporter.report({ message: 'Second', level: 'error' });
      await reporter.report({ message: 'Third', level: 'error' });

      expect(Sentry.BrowserClient).toHaveBeenCalledTimes(1);
    });

    it('filters out problematic browser integrations', async () => {
      new SentryReporter('https://example@sentry.io/123');

      // Wait for initialization
      await new Promise((resolve) => setTimeout(resolve, 0));

      const clientConfig = vi.mocked(Sentry.BrowserClient).mock.calls[0]?.[0];
      expect(clientConfig?.integrations).toHaveLength(1);
      expect((clientConfig?.integrations?.[0] as any)?.name).toBe(
        'SafeIntegration'
      );
    });

    it('does not send personally identifiable information', async () => {
      new SentryReporter('https://example@sentry.io/123');

      // Wait for initialization
      await new Promise((resolve) => setTimeout(resolve, 0));

      const clientConfig = vi.mocked(Sentry.BrowserClient).mock.calls[0]?.[0];
      expect(clientConfig?.sendDefaultPii).toBe(false);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      vi.mocked(preferences.isErrorLoggingEnabled).mockReturnValue(true);
      // Mock the minimum needed for initialization
      vi.mocked(Sentry.getDefaultIntegrations).mockReturnValue([]);
      vi.mocked(Sentry.BrowserClient).mockImplementation(
        () => ({ init: vi.fn() }) as any
      );
      vi.mocked(Sentry.Scope).mockImplementation(
        () => ({ setClient: vi.fn() }) as any
      );
    });

    it('handles circular references in context gracefully', async () => {
      vi.mocked(Sentry.captureException).mockImplementation(
        () => 'event-id' as any
      );
      const reporter = new SentryReporter('https://example@sentry.io/123');

      const circular: any = { value: 1 };
      circular.self = circular;

      await expect(
        reporter.report({
          message: 'Error with circular ref',
          level: 'error',
          context: circular,
        })
      ).resolves.not.toThrow();
    });

    it('continues to work even if Sentry fails', async () => {
      vi.mocked(Sentry.captureException).mockRejectedValue(
        new Error('Network error')
      );
      const reporter = new SentryReporter('https://example@sentry.io/123');

      await expect(
        reporter.report({
          message: 'Should not throw',
          level: 'error',
        })
      ).resolves.not.toThrow();
    });
  });
});
