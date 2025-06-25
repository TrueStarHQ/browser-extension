class PreferencesManager {
  private errorLoggingEnabled: boolean = false; // Default to disabled for privacy
  private loadPromise: Promise<void>;

  constructor() {
    this.loadPromise = this.loadPreferences();
  }

  private async loadPreferences(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.get('errorLoggingEnabled', (result) => {
        this.errorLoggingEnabled = result.errorLoggingEnabled ?? false;
        resolve();
      });
    });
  }

  async waitForLoad(): Promise<void> {
    await this.loadPromise;
  }

  setErrorLoggingEnabled(enabled: boolean): void {
    this.errorLoggingEnabled = enabled;
    chrome.storage.local.set({ errorLoggingEnabled: enabled });
  }

  isErrorLoggingEnabled(): boolean {
    return this.errorLoggingEnabled;
  }
}

export const preferencesManager = new PreferencesManager();
