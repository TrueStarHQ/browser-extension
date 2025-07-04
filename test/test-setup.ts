import '@testing-library/jest-dom';

import { vi } from 'vitest';

// Mock Chrome APIs for testing
const chrome = {
  storage: {
    local: {
      get: vi.fn((_keys: string[], callback: (result: Record<string, unknown>) => void) => {
        callback({});
      }),
      set: vi.fn((_data: Record<string, unknown>, callback: () => void) => {
        callback();
      }),
      onChanged: {
        addListener: vi.fn(),
      },
    },
  },
  runtime: {
    lastError: null as { message: string } | null | undefined,
  },
};

Object.defineProperty(global, 'chrome', {
  value: chrome,
  writable: true,
});

export { chrome as mockChrome };
