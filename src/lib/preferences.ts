class PreferencesManager {
  private loadPromise: Promise<void>;

  // Single source of truth for preferences and their defaults
  private preferences = {
    errorLoggingEnabled: false, // Default to disabled for privacy
  };

  constructor() {
    this.loadPromise = this.loadPreferences();
  }

  private async loadPreferences(): Promise<void> {
    return new Promise((resolve, reject) => {
      const keys = Object.keys(this.preferences) as Array<
        keyof typeof this.preferences
      >;
      chrome.storage.local.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          console.error(
            'Failed to load preferences:',
            chrome.runtime.lastError
          );
          reject(
            new Error(
              `Failed to load preferences: ${chrome.runtime.lastError.message}`
            )
          );
          return;
        }

        // Update preferences with stored values or keep defaults
        for (const key of keys) {
          if (result[key] !== undefined) {
            this.preferences[key] = result[key];
          }
        }
        resolve();
      });
    });
  }

  /**
   * Wait for preferences to be loaded from storage before using them.
   */
  async waitForLoad(): Promise<void> {
    await this.loadPromise;
  }

  /**
   * Enable or disable error logging.
   */
  setErrorLoggingEnabled(enabled: boolean): void {
    this.setPreference('errorLoggingEnabled', enabled);
  }

  /**
   * Set a preference value with type safety.
   * @param key - The preference key
   * @param value - The new value for the preference
   */
  setPreference<K extends keyof typeof this.preferences>(
    key: K,
    value: (typeof this.preferences)[K]
  ): void {
    const oldValue = this.preferences[key];
    this.preferences[key] = value;
    chrome.storage.local.set({ [key]: value }, () => {
      if (chrome.runtime.lastError) {
        console.error(
          `Failed to save preference ${String(key)}:`,
          chrome.runtime.lastError
        );
        // Revert the in-memory change since storage failed
        this.preferences[key] = oldValue;
      }
    });
  }

  /**
   * Get a preference value with type safety.
   * @param key - The preference key
   * @returns The current value of the preference
   */
  getPreference<K extends keyof typeof this.preferences>(
    key: K
  ): (typeof this.preferences)[K] {
    return this.preferences[key];
  }

  /**
   * Check if error logging is currently enabled.
   */
  isErrorLoggingEnabled(): boolean {
    return this.preferences.errorLoggingEnabled;
  }
}

export const preferencesManager = new PreferencesManager();
