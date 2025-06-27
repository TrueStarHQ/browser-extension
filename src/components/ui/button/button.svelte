<script lang="ts">
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import { buttonVariants, type Variant, type Size } from './index.js';
  import { cn } from '$lib/utils/style-utils';

  type $$Props = HTMLButtonAttributes & {
    variant?: Variant;
    size?: Size;
  };

  let className: $$Props['class'] = undefined;
  export let variant: $$Props['variant'] = 'default';
  export let size: $$Props['size'] = 'default';
  export { className as class };
</script>

<button
  class={cn(buttonVariants({ variant, size }), className)}
  type="button"
  data-variant={variant}
  data-size={size}
  {...$$restProps}
  on:click
  on:keydown
>
  <slot />
</button>
