class PreferencesManager {
  private loadPromise: Promise<void>;
  private changeListeners: Set<
    (changes: Partial<typeof this.preferences>) => void
  > = new Set();

  // Single source of truth for preferences and their defaults
  private preferences = {
    errorLoggingEnabled: false, // Default to disabled for privacy
  };

  constructor() {
    this.loadPromise = this.loadPreferences();
    this.setupStorageListener();
  }

  private async loadPreferences(): Promise<void> {
    return new Promise((resolve) => {
      const keys = Object.keys(this.preferences) as Array<
        keyof typeof this.preferences
      >;
      chrome.storage.local.get(keys, (result) => {
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

  private setupStorageListener(): void {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'local') return;

      const relevantChanges: Partial<typeof this.preferences> = {};

      // Handle all preference changes generically
      for (const [key, change] of Object.entries(changes)) {
        if (key in this.preferences) {
          const prefKey = key as keyof typeof this.preferences;
          const newValue = change.newValue ?? this.preferences[prefKey];

          // Update the preference
          this.preferences[prefKey] = newValue;
          relevantChanges[prefKey] = newValue;
        }
      }

      if (Object.keys(relevantChanges).length > 0) {
        this.changeListeners.forEach((listener) => listener(relevantChanges));
      }
    });
  }

  async waitForLoad(): Promise<void> {
    await this.loadPromise;
  }

  setErrorLoggingEnabled(enabled: boolean): void {
    this.setPreference('errorLoggingEnabled', enabled);
  }

  private setPreference<K extends keyof typeof this.preferences>(
    key: K,
    value: (typeof this.preferences)[K]
  ): void {
    this.preferences[key] = value;
    chrome.storage.local.set({ [key]: value });
  }

  isErrorLoggingEnabled(): boolean {
    return this.preferences.errorLoggingEnabled;
  }

  onPreferencesChanged(
    listener: (changes: Partial<typeof this.preferences>) => void
  ): void {
    this.changeListeners.add(listener);
  }

  removePreferencesChangedListener(
    listener: (changes: Partial<typeof this.preferences>) => void
  ): void {
    this.changeListeners.delete(listener);
  }
}

export const preferencesManager = new PreferencesManager();
