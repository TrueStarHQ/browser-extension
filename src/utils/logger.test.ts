import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { log } from './logger';

vi.mock('./sentry-reporter', () => ({
  SentryReporter: vi.fn().mockImplementation(() => ({
    reportError: vi.fn(),
  })),
}));

describe('Logger', () => {
  let consoleSpy: {
    info: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };

    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.info.mockRestore();
    consoleSpy.warn.mockRestore();
    consoleSpy.error.mockRestore();
  });

  describe('info', () => {
    it('logs info messages with TrueStar prefix', () => {
      log.info('Test message');

      expect(consoleSpy.info).toHaveBeenCalledWith('[TrueStar] Test message');
    });

    it('passes additional arguments to console.info', () => {
      const obj = { test: 'data' };
      log.info('Test message', obj, 'extra');

      expect(consoleSpy.info).toHaveBeenCalledWith(
        '[TrueStar] Test message',
        obj,
        'extra'
      );
    });
  });

  describe('warning', () => {
    it('logs warning messages with TrueStar prefix', () => {
      log.warn('Warning message');

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        '[TrueStar] Warning message'
      );
    });

    it('passes additional arguments to console.warn', () => {
      const obj = { warning: 'data' };
      log.warn('Warning message', obj);

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        '[TrueStar] Warning message',
        obj
      );
    });
  });

  describe('error', () => {
    it('logs error messages with TrueStar prefix', () => {
      log.error('Error message');

      expect(consoleSpy.error).toHaveBeenCalledWith('[TrueStar] Error message');
    });

    it('passes additional arguments to console.error', () => {
      const error = new Error('Test error');
      log.error('Error message', error, 'context');

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '[TrueStar] Error message',
        error,
        'context'
      );
    });
  });

  describe('error reporting integration', () => {
    it('logs errors normally regardless of error reporter availability', () => {
      const error = new Error('Test error');
      log.error('Error occurred', error, 'context');

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '[TrueStar] Error occurred',
        error,
        'context'
      );
    });

    it('handles case when no Error object is passed', () => {
      log.error('Simple error message', 'string data', { context: 'object' });

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '[TrueStar] Simple error message',
        'string data',
        { context: 'object' }
      );
    });
  });

  describe('singleton behavior', () => {
    it('maintains consistent prefix across calls', () => {
      log.info('First message');
      log.warn('Second message');
      log.error('Third message');

      expect(consoleSpy.info).toHaveBeenCalledWith('[TrueStar] First message');
      expect(consoleSpy.warn).toHaveBeenCalledWith('[TrueStar] Second message');
      expect(consoleSpy.error).toHaveBeenCalledWith('[TrueStar] Third message');
    });
  });
});
