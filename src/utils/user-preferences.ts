import { log } from './logger';

class Preferences {
  private loadPromise: Promise<void>;

  private preferences: PreferenceValues = {
    errorLoggingEnabled: false,
  };

  constructor() {
    this.loadPromise = this.load();
  }

  public async waitForLoad(): Promise<void> {
    await this.loadPromise;
  }
  
  public setErrorLoggingEnabled(enabled: boolean): void {
    this.setPreference('errorLoggingEnabled', enabled);
  }
  
  public isErrorLoggingEnabled(): boolean {
    return this.getPreference('errorLoggingEnabled');
  }

  private async load(): Promise<void> {
    const preferenceKeys = this.getPreferenceKeys();
    
    try {
      const storedPreferences = await this.getStoredPreferences(preferenceKeys);
      this.applyStoredPreferences(storedPreferences);
    } catch (error) {
      log.error('Failed to load preferences:', error);
      throw error;
    }
  }

  private getPreferenceKeys(): PreferenceKey[] {
    return Object.keys(this.preferences) as PreferenceKey[];
  }

  private getStoredPreferences(keys: PreferenceKey[]): Promise<Partial<PreferenceValues>> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          reject(
            new Error(`Failed to load preferences: ${chrome.runtime.lastError.message}`)
          );
          return;
        }
        
        resolve(result as Partial<PreferenceValues>);
      });
    });
  }

  private applyStoredPreferences(storedPreferences: Partial<PreferenceValues>): void {
    const keys = this.getPreferenceKeys();
    
    for (const key of keys) {
      if (storedPreferences[key] !== undefined) {
        this.preferences[key] = storedPreferences[key];
      }
    }
  }

  private setPreference<K extends PreferenceKey>(key: K, value: PreferenceValues[K]): void {
    const oldValue = this.preferences[key];
    this.preferences[key] = value;
    chrome.storage.local.set({ [key]: value }, () => {
      if (chrome.runtime.lastError) {
        log.error(
          `Failed to save preference ${String(key)}:`,
          chrome.runtime.lastError
        );
        
        this.preferences[key] = oldValue;
      }
    });
  }

  private getPreference<K extends PreferenceKey>(key: K): PreferenceValues[K] {
    return this.preferences[key];
  }
}

export let preferences = new Preferences();

export const resetPreferencesForTesting = () => {
  if (import.meta.env.MODE === 'test') {
    preferences = new Preferences();
  }
};

type PreferenceValues = {
  errorLoggingEnabled: boolean;
};

type PreferenceKey = keyof PreferenceValues;
