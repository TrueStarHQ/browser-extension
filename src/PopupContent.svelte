<script lang="ts">
  import { onMount } from 'svelte';
  import { preferencesManager } from './lib/preferences';

  let errorReportingEnabled = false;
  let loading = true;

  onMount(async () => {
    // Wait for preferences to load from storage
    await preferencesManager.waitForLoad();
    errorReportingEnabled = preferencesManager.isErrorLoggingEnabled();
    loading = false;
  });

  function handleToggle() {
    preferencesManager.setErrorLoggingEnabled(errorReportingEnabled);
  }
</script>

<div class="popup-container">
  <div class="header">
    <h1>TrueStar</h1>
    <p class="subtitle">Fake product review detection</p>
  </div>

  <div class="settings">
    {#if loading}
      <div class="loading">Loading...</div>
    {:else}
      <label class="checkbox-container">
        <input
          type="checkbox"
          bind:checked={errorReportingEnabled}
          on:change={handleToggle}
        />
        <span class="checkmark"></span>
        Enable error reporting
      </label>
      <p class="help-text">
        Help improve TrueStar by sending anonymous error reports
      </p>
    {/if}
  </div>
</div>

<style>
  .popup-container {
    width: 280px;
    padding: 20px;
    font-family:
      -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #ffffff;
  }

  .header {
    text-align: center;
    margin-bottom: 20px;
  }

  .header h1 {
    margin: 0 0 4px 0;
    font-size: 24px;
    font-weight: 600;
    color: #1a1a1a;
  }

  .subtitle {
    margin: 0;
    font-size: 14px;
    color: #666;
  }

  .settings {
    border-top: 1px solid #e5e5e5;
    padding-top: 16px;
  }

  .loading {
    text-align: center;
    color: #666;
    padding: 20px;
  }

  .checkbox-container {
    display: flex;
    align-items: center;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    color: #1a1a1a;
  }

  .checkbox-container input[type='checkbox'] {
    margin-right: 8px;
    width: 16px;
    height: 16px;
    cursor: pointer;
  }

  .help-text {
    margin: 8px 0 0 24px;
    font-size: 12px;
    color: #666;
    line-height: 1.4;
  }

  .checkmark {
    /* Custom checkbox styling could go here if needed */
  }
</style>
