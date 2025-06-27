<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
</script>

<Card
  id="truestar-loader"
  class="fixed top-5 right-5 w-[300px] shadow-lg z-[10000]"
  role="status"
  aria-label="Loading TrueStar analysis"
  aria-live="polite"
>
  <CardHeader class="pb-3">
    <CardTitle class="text-lg text-center">TrueStar Analysis</CardTitle>
  </CardHeader>
  <CardContent class="text-center space-y-2">
    <div class="text-sm">Loading reviews from multiple pages...</div>
    <div class="text-xs text-muted-foreground">This may take a moment</div>
    <div class="sr-only">Please wait while we analyze the reviews</div>
  </CardContent>
</Card>
