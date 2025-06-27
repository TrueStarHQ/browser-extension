import '@testing-library/jest-dom';

// Mock Chrome APIs for testing
const chrome = {
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      onChanged: {
        addListener: vi.fn(),
      },
    },
  },
  runtime: {
    lastError: null,
  },
};

Object.defineProperty(global, 'chrome', {
  value: chrome,
  writable: true,
});

// Export for use in tests
export { chrome as mockChrome };
