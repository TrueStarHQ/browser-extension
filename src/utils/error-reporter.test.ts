import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { mockChrome } from '../../test/test-setup';
import { ErrorReporter } from './error-reporter';

// Mock Sentry module
vi.mock('@sentry/svelte', () => ({
  getDefaultIntegrations: vi.fn(() => [
    { name: 'BrowserApiErrors' },
    { name: 'Breadcrumbs' },
    { name: 'GlobalHandlers' },
    { name: 'SafeIntegration' },
  ]),
  BrowserClient: vi.fn().mockImplementation(() => ({
    init: vi.fn(),
  })),
  makeFetchTransport: vi.fn(),
  defaultStackParser: vi.fn(),
  Scope: vi.fn().mockImplementation(() => ({
    setClient: vi.fn(),
  })),
  captureException: vi.fn(),
}));

// Mock preferences manager
vi.mock('./user-preferences', () => ({
  preferencesManager: {
    isErrorLoggingEnabled: vi.fn(),
  },
}));

import * as Sentry from '@sentry/svelte';

import { preferencesManager } from './user-preferences';

describe('ErrorReporter', () => {
  let errorReporter: ErrorReporter;
  const mockDsn = 'https://fake-dsn@sentry.io/12345';

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    mockChrome.runtime.lastError = null;

    // Reset Sentry mocks
    (Sentry.getDefaultIntegrations as ReturnType<typeof vi.fn>).mockReturnValue(
      [
        { name: 'BrowserApiErrors' },
        { name: 'Breadcrumbs' },
        { name: 'GlobalHandlers' },
        { name: 'SafeIntegration' },
      ]
    );

    // Mock environment
    vi.stubEnv('VITE_ENVIRONMENT', 'test');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('constructor', () => {
    it('should create ErrorReporter with DSN', () => {
      errorReporter = new ErrorReporter(mockDsn);
      expect(errorReporter).toBeInstanceOf(ErrorReporter);
    });

    it('should not initialize if error logging is disabled', () => {
      (
        preferencesManager.isErrorLoggingEnabled as ReturnType<typeof vi.fn>
      ).mockReturnValue(false);

      errorReporter = new ErrorReporter(mockDsn);

      expect(Sentry.BrowserClient).not.toHaveBeenCalled();
    });

    it('should not initialize if DSN is empty', () => {
      (
        preferencesManager.isErrorLoggingEnabled as ReturnType<typeof vi.fn>
      ).mockReturnValue(true);

      errorReporter = new ErrorReporter('');

      expect(Sentry.BrowserClient).not.toHaveBeenCalled();
    });
  });

  describe('initialization', () => {
    beforeEach(() => {
      (
        preferencesManager.isErrorLoggingEnabled as ReturnType<typeof vi.fn>
      ).mockReturnValue(true);
    });

    it('should filter out problematic integrations', async () => {
      errorReporter = new ErrorReporter(mockDsn);

      // Wait for async initialization
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(Sentry.BrowserClient).toHaveBeenCalledWith({
        dsn: mockDsn,
        environment: 'test',
        transport: Sentry.makeFetchTransport,
        stackParser: Sentry.defaultStackParser,
        integrations: [{ name: 'SafeIntegration' }], // Only the safe one should remain
        sendDefaultPii: false,
      });
    });

    it('should initialize Sentry client and scope', async () => {
      const mockClient = {
        init: vi.fn(),
      };
      const mockScope = {
        setClient: vi.fn(),
      };

      (Sentry.BrowserClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockClient
      );
      (Sentry.Scope as ReturnType<typeof vi.fn>).mockReturnValue(mockScope);

      errorReporter = new ErrorReporter(mockDsn);

      // Wait for async initialization
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockScope.setClient).toHaveBeenCalledWith(mockClient);
      expect(mockClient.init).toHaveBeenCalled();
    });

    it('should only initialize once', async () => {
      errorReporter = new ErrorReporter(mockDsn);

      // Trigger initialization multiple times
      await errorReporter.report({ message: 'test1', level: 'error' });
      await errorReporter.report({ message: 'test2', level: 'error' });

      expect(Sentry.BrowserClient).toHaveBeenCalledTimes(1);
    });
  });

  describe('report', () => {
    beforeEach(() => {
      (
        preferencesManager.isErrorLoggingEnabled as ReturnType<typeof vi.fn>
      ).mockReturnValue(true);
      errorReporter = new ErrorReporter(mockDsn);
    });

    it('should not report when error logging is disabled', async () => {
      (
        preferencesManager.isErrorLoggingEnabled as ReturnType<typeof vi.fn>
      ).mockReturnValue(false);

      await errorReporter.report({ message: 'test error', level: 'error' });

      expect(Sentry.captureException).not.toHaveBeenCalled();
    });

    it('should report error with correct parameters', async () => {
      const errorReport = {
        message: 'Test error message',
        level: 'error' as const,
        context: { userId: '123', action: 'button-click' },
        tags: { component: 'header' },
      };

      await errorReporter.report(errorReport);

      expect(Sentry.captureException).toHaveBeenCalledWith(
        new Error('Test error message'),
        {
          level: 'error',
          tags: { component: 'header' },
          contexts: {
            custom: { userId: '123', action: 'button-click' },
          },
        }
      );
    });

    it('should report warning with correct parameters', async () => {
      const warningReport = {
        message: 'Test warning message',
        level: 'warning' as const,
        context: { feature: 'analytics' },
      };

      await errorReporter.report(warningReport);

      expect(Sentry.captureException).toHaveBeenCalledWith(
        new Error('Test warning message'),
        {
          level: 'warning',
          tags: undefined,
          contexts: {
            custom: { feature: 'analytics' },
          },
        }
      );
    });

    it('should handle report without context or tags', async () => {
      await errorReporter.report({ message: 'Simple error', level: 'error' });

      expect(Sentry.captureException).toHaveBeenCalledWith(
        new Error('Simple error'),
        {
          level: 'error',
          tags: undefined,
          contexts: {
            custom: undefined,
          },
        }
      );
    });
  });

  describe('reportError', () => {
    beforeEach(() => {
      (
        preferencesManager.isErrorLoggingEnabled as ReturnType<typeof vi.fn>
      ).mockReturnValue(true);
      errorReporter = new ErrorReporter(mockDsn);
    });

    it('should report string message as error', async () => {
      await errorReporter.reportError('Something went wrong', undefined, {
        step: 'validation',
      });

      expect(Sentry.captureException).toHaveBeenCalledWith(
        new Error('Something went wrong'),
        {
          level: 'error',
          tags: undefined,
          contexts: {
            custom: {
              step: 'validation',
              originalMessage: 'Something went wrong',
              errorType: undefined,
            },
          },
        }
      );
    });

    it('should use Error object message when provided', async () => {
      const actualError = new Error('Actual error message');

      await errorReporter.reportError('User-friendly message', actualError, {
        component: 'form',
      });

      expect(Sentry.captureException).toHaveBeenCalledWith(
        new Error('Actual error message'),
        {
          level: 'error',
          tags: undefined,
          contexts: {
            custom: {
              component: 'form',
              originalMessage: 'User-friendly message',
              errorType: 'Error',
            },
          },
        }
      );
    });

    it('should handle non-Error objects', async () => {
      const weirdError = { toString: () => 'weird error' };

      await errorReporter.reportError('Something failed', weirdError, {
        location: 'api',
      });

      expect(Sentry.captureException).toHaveBeenCalledWith(
        new Error('Something failed'),
        {
          level: 'error',
          tags: undefined,
          contexts: {
            custom: {
              location: 'api',
              originalMessage: 'Something failed',
              errorType: 'Object',
            },
          },
        }
      );
    });
  });

  describe('reportWarning', () => {
    beforeEach(() => {
      (
        preferencesManager.isErrorLoggingEnabled as ReturnType<typeof vi.fn>
      ).mockReturnValue(true);
      errorReporter = new ErrorReporter(mockDsn);
    });

    it('should report warning with correct level', async () => {
      await errorReporter.reportWarning('Performance warning', {
        metric: 'loadTime',
      });

      expect(Sentry.captureException).toHaveBeenCalledWith(
        new Error('Performance warning'),
        {
          level: 'warning',
          tags: undefined,
          contexts: {
            custom: { metric: 'loadTime' },
          },
        }
      );
    });

    it('should handle warning without context', async () => {
      await errorReporter.reportWarning('Simple warning');

      expect(Sentry.captureException).toHaveBeenCalledWith(
        new Error('Simple warning'),
        {
          level: 'warning',
          tags: undefined,
          contexts: {
            custom: undefined,
          },
        }
      );
    });
  });

  describe('edge cases', () => {
    it('should skip initialization when no DSN provided', () => {
      (
        preferencesManager.isErrorLoggingEnabled as ReturnType<typeof vi.fn>
      ).mockReturnValue(true);

      errorReporter = new ErrorReporter('');

      expect(Sentry.BrowserClient).not.toHaveBeenCalled();
    });

    it('should handle multiple rapid initialization attempts', async () => {
      (
        preferencesManager.isErrorLoggingEnabled as ReturnType<typeof vi.fn>
      ).mockReturnValue(true);
      errorReporter = new ErrorReporter(mockDsn);

      // Trigger multiple reports rapidly
      const promises = [
        errorReporter.report({ message: 'test1', level: 'error' }),
        errorReporter.report({ message: 'test2', level: 'error' }),
        errorReporter.report({ message: 'test3', level: 'error' }),
      ];

      await Promise.all(promises);

      // Should only initialize once despite multiple reports
      expect(Sentry.BrowserClient).toHaveBeenCalledTimes(1);
    });
  });
});
