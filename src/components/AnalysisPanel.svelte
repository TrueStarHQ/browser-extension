<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
  import { Button } from './ui/button';
  import { cn } from '$lib/utils';

  interface Props {
    analysis: {
      isFake: boolean;
      confidence: number;
      summary: string;
      reasons: string[];
      flags: string[];
    };
    onClose?: () => void;
  }

  let { analysis, onClose }: Props = $props();

  const fakeScore = $derived(
    analysis.isFake
      ? Math.round(analysis.confidence * 100)
      : Math.round((1 - analysis.confidence) * 100)
  );

  const scoreColor = $derived(
    fakeScore > 70
      ? 'text-red-600'
      : fakeScore > 40
        ? 'text-orange-500'
        : 'text-green-600'
  );

  const progressColor = $derived(
    fakeScore > 70
      ? 'bg-red-600'
      : fakeScore > 40
        ? 'bg-orange-500'
        : 'bg-green-600'
  );

  const allRedFlags = $derived([
    ...(Array.isArray(analysis.reasons) ? analysis.reasons : []),
    ...(Array.isArray(analysis.flags) ? analysis.flags : []),
  ]);
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
    <div>
      <div class="flex justify-between items-center mb-2">
        <span class="text-sm font-medium">Fake Review Score:</span>
        <span class={cn('text-lg font-bold', scoreColor)}>{fakeScore}%</span>
      </div>
      <div
        class="w-full bg-gray-200 rounded-full h-2"
        role="progressbar"
        aria-label="Fake review score indicator"
        aria-valuenow={fakeScore}
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div
          class={cn('h-2 rounded-full transition-all', progressColor)}
          style="width: {fakeScore}%"
        ></div>
      </div>
    </div>

    <div class="text-sm text-muted-foreground">
      Confidence: {Math.round(analysis.confidence * 100)}%
    </div>

    <div class="text-sm">
      {analysis.summary || 'No analysis available'}
    </div>

    {#if allRedFlags.length > 0}
      <details class="text-sm">
        <summary
          class="cursor-pointer text-primary hover:underline"
          aria-label="Show {allRedFlags.length} red flags"
        >
          Red Flags ({allRedFlags.length})
        </summary>
        <ul class="mt-2 ml-4 list-disc space-y-1">
          {#each allRedFlags as flag}
            <li>{flag}</li>
          {/each}
        </ul>
      </details>
    {/if}
  </CardContent>
</Card>
