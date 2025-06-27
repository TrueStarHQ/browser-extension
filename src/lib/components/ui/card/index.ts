import { tv } from 'tailwind-variants';

export { default as Card } from './card.svelte';
export { default as CardContent } from './card-content.svelte';
export { default as CardDescription } from './card-description.svelte';
export { default as CardFooter } from './card-footer.svelte';
export { default as CardHeader } from './card-header.svelte';
export { default as CardTitle } from './card-title.svelte';

export const cardVariants = tv({
  base: 'rounded-lg border bg-card text-card-foreground shadow-sm',
});

export type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
