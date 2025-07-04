import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockChrome } from '../../test/test-setup';
import { preferences, resetPreferencesForTesting } from './user-preferences';

type StorageGetCallback = (result: Record<string, unknown>) => void;
type StorageSetCallback = () => void;

describe('Preferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChrome.runtime.lastError = null;
    
    mockChrome.storage.local.get.mockImplementation(
      (_keys: string[], callback: StorageGetCallback) => {
        callback({});
      }
    );
    mockChrome.storage.local.set.mockImplementation(
      (_data: Record<string, unknown>, callback: StorageSetCallback) => {
        callback();
      }
    );
    
    resetPreferencesForTesting();
  });

  it('calls chrome.storage.local.get on construction', () => {
    expect(mockChrome.storage.local.get).toHaveBeenCalledWith(
      ['errorLoggingEnabled'],
      expect.any(Function)
    );
  });

  describe('waitForLoad', () => {
    it('resolves after successful storage load', async () => {
      await expect(preferences.waitForLoad()).resolves.toBeUndefined();
    });

    it('rejects when chrome.storage.local.get fails', async () => {
      vi.clearAllMocks();
      mockChrome.storage.local.get.mockImplementation(
        (_keys: string[], callback: StorageGetCallback) => {
          mockChrome.runtime.lastError = { message: 'Storage error' };
          callback({});
        }
      );
      
      resetPreferencesForTesting();

      await expect(preferences.waitForLoad()).rejects.toThrow('Storage error');
    });

    it('uses defaults when storage is empty', () => {
      expect(preferences.isErrorLoggingEnabled()).toBe(false);
    });

    it('uses stored values when they exist', async () => {
      vi.clearAllMocks();
      mockChrome.storage.local.get.mockImplementation(
        (_keys: string[], callback: StorageGetCallback) => {
          callback({ errorLoggingEnabled: true });
        }
      );
      
      resetPreferencesForTesting();

      await preferences.waitForLoad();
      expect(preferences.isErrorLoggingEnabled()).toBe(true);
    });
  });

  describe('setErrorLoggingEnabled', () => {
    it('updates preference and saves to storage', () => {
      preferences.setErrorLoggingEnabled(true);

      expect(preferences.isErrorLoggingEnabled()).toBe(true);
      expect(mockChrome.storage.local.set).toHaveBeenCalledWith(
        { errorLoggingEnabled: true },
        expect.any(Function)
      );
    });

    it('reverts in-memory change when storage fails', async () => {
      await preferences.waitForLoad();
      expect(preferences.isErrorLoggingEnabled()).toBe(false);

      mockChrome.storage.local.set.mockImplementation(
        (_data: Record<string, unknown>, callback: StorageSetCallback) => {
          mockChrome.runtime.lastError = { message: 'Storage full' };
          callback();
        }
      );

      const originalValue = preferences.isErrorLoggingEnabled();
      preferences.setErrorLoggingEnabled(true);

      expect(preferences.isErrorLoggingEnabled()).toBe(originalValue);
    });

    it('logs error when storage fails', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockChrome.storage.local.set.mockImplementation(
        (_data: Record<string, unknown>, callback: StorageSetCallback) => {
          mockChrome.runtime.lastError = { message: 'Storage full' };
          callback();
        }
      );

      preferences.setErrorLoggingEnabled(true);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[TrueStar] Failed to save preference errorLoggingEnabled:',
        { message: 'Storage full' }
      );

      consoleSpy.mockRestore();
    });
  });

  describe('isErrorLoggingEnabled', () => {
    it('returns false by default', () => {
      expect(preferences.isErrorLoggingEnabled()).toBe(false);
    });

    it('returns stored value when available', async () => {
      vi.clearAllMocks();
      mockChrome.storage.local.get.mockImplementation(
        (_keys: string[], callback: StorageGetCallback) => {
          callback({ errorLoggingEnabled: true });
        }
      );
      resetPreferencesForTesting();

      await preferences.waitForLoad();

      expect(preferences.isErrorLoggingEnabled()).toBe(true);
    });
  });

  describe('error handling edge cases', () => {
    it('handles undefined chrome.runtime.lastError gracefully', () => {
      mockChrome.storage.local.set.mockImplementation(
        (_data: Record<string, unknown>, callback: StorageSetCallback) => {
          mockChrome.runtime.lastError = undefined;
          callback();
        }
      );

      expect(() => preferences.setErrorLoggingEnabled(true)).not.toThrow();
    });

    it('handles null chrome.runtime.lastError gracefully', () => {
      mockChrome.storage.local.set.mockImplementation(
        (_data: Record<string, unknown>, callback: StorageSetCallback) => {
          mockChrome.runtime.lastError = null;
          callback();
        }
      );

      expect(() => preferences.setErrorLoggingEnabled(true)).not.toThrow();
    });
  });

  it('handles multiple setErrorLoggingEnabled calls correctly', () => {
    vi.clearAllMocks();
    
    preferences.setErrorLoggingEnabled(true);
    preferences.setErrorLoggingEnabled(false);
    preferences.setErrorLoggingEnabled(true);

    expect(preferences.isErrorLoggingEnabled()).toBe(true);
    expect(mockChrome.storage.local.set).toHaveBeenCalledTimes(3);
  });
});