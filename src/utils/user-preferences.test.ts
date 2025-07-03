import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockChrome } from '../../test/test-setup';
import { PreferencesManager, preferencesManager } from './user-preferences';

// Type definitions for Chrome storage API callbacks
type StorageGetCallback = (result: Record<string, unknown>) => void;
type StorageSetCallback = () => void;

describe('PreferencesManager', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Reset chrome runtime error
    mockChrome.runtime.lastError = null;
  });

  describe('initialization', () => {
    it('should call chrome.storage.local.get on construction', () => {
      // Mock storage before creating instance
      mockChrome.storage.local.get.mockImplementation(
        (_keys: string[], callback: StorageGetCallback) => {
          callback({});
        }
      );

      new PreferencesManager();

      expect(mockChrome.storage.local.get).toHaveBeenCalledWith(
        ['errorLoggingEnabled'],
        expect.any(Function)
      );
    });
  });

  describe('waitForLoad', () => {
    it('should resolve after successful storage load', async () => {
      // Mock successful storage response
      mockChrome.storage.local.get.mockImplementation(
        (_keys: string[], callback: StorageGetCallback) => {
          callback({ errorLoggingEnabled: true });
        }
      );

      const manager = new PreferencesManager();
      await expect(manager.waitForLoad()).resolves.toBeUndefined();
    });

    it('should reject when chrome.storage.local.get fails', async () => {
      // Mock storage error
      mockChrome.storage.local.get.mockImplementation(
        (_keys: string[], callback: StorageGetCallback) => {
          mockChrome.runtime.lastError = { message: 'Storage error' };
          callback({});
        }
      );

      const manager = new PreferencesManager();
      await expect(manager.waitForLoad()).rejects.toThrow(
        'Failed to load preferences: Storage error'
      );
    });

    it('should use defaults when storage is empty', async () => {
      // Mock empty storage response
      mockChrome.storage.local.get.mockImplementation(
        (_keys: string[], callback: StorageGetCallback) => {
          callback({});
        }
      );

      const manager = new PreferencesManager();
      await manager.waitForLoad();
      expect(manager.isErrorLoggingEnabled()).toBe(false);
    });

    it('should use stored values when they exist', async () => {
      // Mock storage with stored value
      mockChrome.storage.local.get.mockImplementation(
        (_keys: string[], callback: StorageGetCallback) => {
          callback({ errorLoggingEnabled: true });
        }
      );

      const manager = new PreferencesManager();
      await manager.waitForLoad();
      expect(manager.isErrorLoggingEnabled()).toBe(true);
    });
  });

  describe('setPreference', () => {
    it('should update preference and save to storage', async () => {
      // Mock successful storage operations
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

      const preferencesManager = new PreferencesManager();
      await preferencesManager.waitForLoad();

      preferencesManager.setPreference('errorLoggingEnabled', true);

      expect(preferencesManager.getPreference('errorLoggingEnabled')).toBe(
        true
      );
      expect(mockChrome.storage.local.set).toHaveBeenCalledWith(
        { errorLoggingEnabled: true },
        expect.any(Function)
      );
    });

    it('should revert in-memory change when storage fails', async () => {
      // Mock initial successful load, then storage failure
      mockChrome.storage.local.get.mockImplementation(
        (_keys: string[], callback: StorageGetCallback) => {
          callback({ errorLoggingEnabled: false });
        }
      );

      const preferencesManager = new PreferencesManager();
      await preferencesManager.waitForLoad();

      // Mock storage failure
      mockChrome.storage.local.set.mockImplementation(
        (_data: Record<string, unknown>, callback: StorageSetCallback) => {
          mockChrome.runtime.lastError = { message: 'Storage full' };
          callback();
        }
      );

      const originalValue = preferencesManager.getPreference(
        'errorLoggingEnabled'
      );
      preferencesManager.setPreference('errorLoggingEnabled', true);

      // Should revert to original value
      expect(preferencesManager.getPreference('errorLoggingEnabled')).toBe(
        originalValue
      );
    });

    it('should log error when storage fails', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockChrome.storage.local.get.mockImplementation(
        (_keys: string[], callback: StorageGetCallback) => {
          callback({});
        }
      );

      const preferencesManager = new PreferencesManager();
      await preferencesManager.waitForLoad();

      mockChrome.storage.local.set.mockImplementation(
        (_data: Record<string, unknown>, callback: StorageSetCallback) => {
          mockChrome.runtime.lastError = { message: 'Storage full' };
          callback();
        }
      );

      preferencesManager.setPreference('errorLoggingEnabled', true);

      expect(consoleSpy).toHaveBeenCalledWith(
        'TrueStar: Failed to save preference errorLoggingEnabled:',
        { message: 'Storage full' }
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getPreference', () => {
    it('should return current preference value', async () => {
      mockChrome.storage.local.get.mockImplementation(
        (_keys: string[], callback: StorageGetCallback) => {
          callback({ errorLoggingEnabled: true });
        }
      );

      const preferencesManager = new PreferencesManager();
      await preferencesManager.waitForLoad();

      expect(preferencesManager.getPreference('errorLoggingEnabled')).toBe(
        true
      );
    });

    it('should have correct TypeScript typing', async () => {
      mockChrome.storage.local.get.mockImplementation(
        (_keys: string[], callback: StorageGetCallback) => {
          callback({});
        }
      );

      const preferencesManager = new PreferencesManager();
      await preferencesManager.waitForLoad();

      // This test ensures type safety - it should compile without errors
      const value: boolean = preferencesManager.getPreference(
        'errorLoggingEnabled'
      );
      expect(typeof value).toBe('boolean');
    });
  });

  describe('setErrorLoggingEnabled', () => {
    it('should set error logging preference', async () => {
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

      const preferencesManager = new PreferencesManager();
      await preferencesManager.waitForLoad();

      preferencesManager.setErrorLoggingEnabled(true);

      expect(preferencesManager.isErrorLoggingEnabled()).toBe(true);
      expect(mockChrome.storage.local.set).toHaveBeenCalledWith(
        { errorLoggingEnabled: true },
        expect.any(Function)
      );
    });
  });

  describe('isErrorLoggingEnabled', () => {
    it('should return false by default', async () => {
      mockChrome.storage.local.get.mockImplementation(
        (_keys: string[], callback: StorageGetCallback) => {
          callback({});
        }
      );

      const preferencesManager = new PreferencesManager();
      await preferencesManager.waitForLoad();

      expect(preferencesManager.isErrorLoggingEnabled()).toBe(false);
    });

    it('should return stored value when available', async () => {
      mockChrome.storage.local.get.mockImplementation(
        (_keys: string[], callback: StorageGetCallback) => {
          callback({ errorLoggingEnabled: true });
        }
      );

      const preferencesManager = new PreferencesManager();
      await preferencesManager.waitForLoad();

      expect(preferencesManager.isErrorLoggingEnabled()).toBe(true);
    });
  });

  describe('error handling edge cases', () => {
    it('should handle undefined chrome.runtime.lastError gracefully', async () => {
      mockChrome.storage.local.get.mockImplementation(
        (_keys: string[], callback: StorageGetCallback) => {
          callback({});
        }
      );

      const preferencesManager = new PreferencesManager();
      await preferencesManager.waitForLoad();

      mockChrome.storage.local.set.mockImplementation(
        (_data: Record<string, unknown>, callback: StorageSetCallback) => {
          mockChrome.runtime.lastError = undefined;
          callback();
        }
      );

      expect(() => {
        preferencesManager.setPreference('errorLoggingEnabled', true);
      }).not.toThrow();
    });

    it('should handle null chrome.runtime.lastError gracefully', async () => {
      mockChrome.storage.local.get.mockImplementation(
        (_keys: string[], callback: StorageGetCallback) => {
          callback({});
        }
      );

      const preferencesManager = new PreferencesManager();
      await preferencesManager.waitForLoad();

      mockChrome.storage.local.set.mockImplementation(
        (_data: Record<string, unknown>, callback: StorageSetCallback) => {
          mockChrome.runtime.lastError = null;
          callback();
        }
      );

      expect(() => {
        preferencesManager.setPreference('errorLoggingEnabled', true);
      }).not.toThrow();
    });
  });
});

describe('Exported preferencesManager singleton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChrome.runtime.lastError = null;
  });

  it('should be an instance of PreferencesManager', () => {
    expect(preferencesManager).toBeInstanceOf(PreferencesManager);
  });

  it('should have public methods available', () => {
    expect(typeof preferencesManager.waitForLoad).toBe('function');
    expect(typeof preferencesManager.setPreference).toBe('function');
    expect(typeof preferencesManager.getPreference).toBe('function');
    expect(typeof preferencesManager.isErrorLoggingEnabled).toBe('function');
    expect(typeof preferencesManager.setErrorLoggingEnabled).toBe('function');
  });

  it('should maintain singleton behavior', async () => {
    // Test that multiple imports return the same instance
    const module1 = await import('./user-preferences');
    const module2 = await import('./user-preferences');
    expect(module1.preferencesManager).toBe(module2.preferencesManager);
    expect(preferencesManager).toBe(module1.preferencesManager);
  });
});

describe('Concurrent operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChrome.runtime.lastError = null;
  });

  it('should handle multiple setPreference calls correctly', async () => {
    mockChrome.storage.local.get.mockImplementation(
      (_keys: string[], callback: StorageGetCallback) => {
        callback({});
      }
    );

    let setCallCount = 0;
    mockChrome.storage.local.set.mockImplementation(
      (_data: Record<string, unknown>, callback: StorageSetCallback) => {
        setCallCount++;
        callback();
      }
    );

    const manager = new PreferencesManager();
    await manager.waitForLoad();

    // Make multiple rapid calls
    manager.setPreference('errorLoggingEnabled', true);
    manager.setPreference('errorLoggingEnabled', false);
    manager.setPreference('errorLoggingEnabled', true);

    // Should reflect the last call
    expect(manager.getPreference('errorLoggingEnabled')).toBe(true);
    // Should have made all storage calls
    expect(setCallCount).toBe(3);
  });

  it('should handle storage failures during concurrent operations', async () => {
    mockChrome.storage.local.get.mockImplementation(
      (_keys: string[], callback: StorageGetCallback) => {
        callback({ errorLoggingEnabled: false });
      }
    );

    let callCount = 0;
    mockChrome.storage.local.set.mockImplementation(
      (_data: Record<string, unknown>, callback: StorageSetCallback) => {
        callCount++;
        if (callCount === 2) {
          // Second call fails
          mockChrome.runtime.lastError = { message: 'Storage error' };
        } else {
          mockChrome.runtime.lastError = null;
        }
        callback();
      }
    );

    const manager = new PreferencesManager();
    await manager.waitForLoad();

    manager.setPreference('errorLoggingEnabled', true); // Should succeed
    manager.setPreference('errorLoggingEnabled', false); // Should fail and revert

    // Should revert to previous successful value
    expect(manager.getPreference('errorLoggingEnabled')).toBe(true);
  });
});

describe('Generic preference system', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChrome.runtime.lastError = null;
  });

  it('should support type-safe generic methods', async () => {
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

    const manager = new PreferencesManager();
    await manager.waitForLoad();

    // Test generic methods work with type safety
    manager.setPreference('errorLoggingEnabled', true);
    const value: boolean = manager.getPreference('errorLoggingEnabled');

    expect(value).toBe(true);
    expect(typeof value).toBe('boolean');
  });
});

describe('Storage corruption and invalid data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChrome.runtime.lastError = null;
  });

  it('should handle corrupted boolean preference data', async () => {
    mockChrome.storage.local.get.mockImplementation(
      (_keys: string[], callback: StorageGetCallback) => {
        callback({
          errorLoggingEnabled: 'invalid_string', // Wrong type
        });
      }
    );

    const manager = new PreferencesManager();
    await manager.waitForLoad();

    // Should handle gracefully - the corrupted value will be used as-is
    // TypeScript can't prevent runtime corruption
    expect(manager.getPreference('errorLoggingEnabled')).toBe('invalid_string');
  });

  it('should handle null/undefined preference values', async () => {
    mockChrome.storage.local.get.mockImplementation(
      (_keys: string[], callback: StorageGetCallback) => {
        callback({
          errorLoggingEnabled: null,
        });
      }
    );

    const manager = new PreferencesManager();
    await manager.waitForLoad();

    expect(manager.getPreference('errorLoggingEnabled')).toBe(null);
  });

  it('should handle storage returning unexpected structure', async () => {
    mockChrome.storage.local.get.mockImplementation(
      (_keys: string[], callback: StorageGetCallback) => {
        // Return completely wrong structure
        callback('invalid_response' as unknown as Record<string, unknown>);
      }
    );

    const manager = new PreferencesManager();

    // Should not crash, should use defaults
    await expect(manager.waitForLoad()).resolves.toBeUndefined();
    expect(manager.isErrorLoggingEnabled()).toBe(false);
  });
});

describe('Initialization race conditions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChrome.runtime.lastError = null;
  });

  it('should return default values before load completes', () => {
    // Don't call the callback immediately
    mockChrome.storage.local.get.mockImplementation(
      (_keys: string[], _callback: StorageGetCallback) => {
        // Callback will be called later
      }
    );

    const manager = new PreferencesManager();

    // Should return defaults even before loading completes
    expect(manager.isErrorLoggingEnabled()).toBe(false);
    expect(manager.getPreference('errorLoggingEnabled')).toBe(false);
  });

  it('should handle setPreference before load completes', () => {
    let storageCallback: (result: Record<string, unknown>) => void;
    mockChrome.storage.local.get.mockImplementation(
      (_keys: string[], callback: StorageGetCallback) => {
        storageCallback = callback;
        // Don't call immediately
      }
    );

    mockChrome.storage.local.set.mockImplementation(
      (_data: Record<string, unknown>, callback: StorageSetCallback) => {
        callback();
      }
    );

    const manager = new PreferencesManager();

    // Set preference before load completes
    manager.setPreference('errorLoggingEnabled', true);
    expect(manager.getPreference('errorLoggingEnabled')).toBe(true);

    // Now complete the load
    storageCallback!({});

    // Should still have the set value
    expect(manager.getPreference('errorLoggingEnabled')).toBe(true);
  });

  it('should prioritize loaded values over pre-load changes', async () => {
    let storageCallback: (result: Record<string, unknown>) => void;
    mockChrome.storage.local.get.mockImplementation(
      (_keys: string[], callback: StorageGetCallback) => {
        storageCallback = callback;
        // Don't call immediately
      }
    );

    mockChrome.storage.local.set.mockImplementation(
      (_data: Record<string, unknown>, callback: StorageSetCallback) => {
        callback();
      }
    );

    const manager = new PreferencesManager();

    // Set preference before load completes
    manager.setPreference('errorLoggingEnabled', true);
    expect(manager.getPreference('errorLoggingEnabled')).toBe(true);

    // Complete load with different value
    storageCallback!({ errorLoggingEnabled: false });
    await manager.waitForLoad();

    // Should now have the loaded value
    expect(manager.getPreference('errorLoggingEnabled')).toBe(false);
  });
});
