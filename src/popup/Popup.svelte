<script lang="ts">
  import '../assets/app.css';

  import { onMount } from 'svelte';

  import { preferencesManager } from '../utils/user-preferences';

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

<div class="w-[280px] p-5 font-sans bg-white">
  <div class="text-center mb-5">
    <h1 class="m-0 mb-1 text-2xl font-semibold text-gray-900">TrueStar</h1>
    <p class="m-0 text-sm text-gray-600">Fake product review detection</p>
  </div>

  <div class="border-t border-gray-200 pt-4">
    {#if loading}
      <div class="text-center text-gray-600 py-5">Loading...</div>
    {:else}
      <label class="flex items-center cursor-pointer text-sm font-medium text-gray-900">
        <input
          type="checkbox"
          bind:checked={errorReportingEnabled}
          on:change={handleToggle}
          class="mr-2 w-4 h-4 cursor-pointer text-primary border-gray-300 rounded focus:ring-primary"
        />
        Enable error reporting
      </label>
      <p class="mt-2 ml-6 text-xs text-gray-600 leading-relaxed">
        Help improve TrueStar by sending anonymous error reports
      </p>
    {/if}
  </div>
</div>
