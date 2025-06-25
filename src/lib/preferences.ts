export interface UserPreferences {
  errorLogging: {
    enabled: boolean;
  };
}

const DEFAULT_PREFERENCES: UserPreferences = {
  errorLogging: {
    enabled: false, // Default to disabled for privacy
  },
};

class PreferencesManager {
  private preferences: UserPreferences = DEFAULT_PREFERENCES;
  private readonly STORAGE_KEY = 'truestar_preferences';

  constructor() {
    this.loadPreferences();
  }

  private loadPreferences(): void {
    chrome.storage.local.get(this.STORAGE_KEY, (result) => {
      if (result[this.STORAGE_KEY]) {
        this.preferences = {
          ...DEFAULT_PREFERENCES,
          ...result[this.STORAGE_KEY],
        };
      }
    });
  }

  private savePreferences(): void {
    chrome.storage.local.set({ [this.STORAGE_KEY]: this.preferences });
  }

  getPreferences(): UserPreferences {
    return { ...this.preferences };
  }

  setErrorLoggingEnabled(enabled: boolean): void {
    this.preferences.errorLogging.enabled = enabled;
    this.savePreferences();
  }

  isErrorLoggingEnabled(): boolean {
    return this.preferences.errorLogging.enabled;
  }
}

export const preferencesManager = new PreferencesManager();
