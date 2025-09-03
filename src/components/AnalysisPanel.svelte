<script lang="ts">
  import type { CheckAmazonProductResponse } from '@truestarhq/shared-types';

  import { Button } from './ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

  interface Props {
    analysis: CheckAmazonProductResponse;
    errorMessage?: string;
    onClose?: () => void;
  }

  const { errorMessage, onClose }: Props = $props();
</script>

<Card
  id="truestar-panel"
  class="fixed top-5 right-5 w-[300px] shadow-lg z-[10000]"
  role="dialog"
  aria-label="TrueStar review analysis results"
>
  <CardHeader class="pb-3">
    <div class="flex items-center justify-between">
      <CardTitle class="text-lg">TrueStar Analysis</CardTitle>
      {#if onClose}
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8 -mr-2 -mt-1"
          onclick={onClose}
          aria-label="Close analysis panel"
        >
          ×
        </Button>
      {/if}
    </div>
  </CardHeader>
  <CardContent class="space-y-4">
    <div class="text-sm">
      {errorMessage || 'Analysis complete'}
    </div>
  </CardContent>
</Card>
