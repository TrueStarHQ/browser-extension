<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { cn } from '$lib/utils/style-utils';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    class?: string;
  }

  const { class: className, ...restProps } = $props<Props>();
</script>

<div class={cn('p-6 pt-0', className)} {...restProps}>
  <slot />
</div>
