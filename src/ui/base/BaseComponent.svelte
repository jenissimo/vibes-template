<script lang="ts" module>
  export function getDimensionsFromElement(className: string, width: number, height: number): { width: number; height: number } {
    if (width > 0 && height > 0) {
      return { width, height };
    }
    const element = document.querySelector(`.${className}`) as HTMLElement;
    if (element) {
      const rect = element.getBoundingClientRect();
      return { width: rect.width || 0, height: rect.height || 0 };
    }
    return { width: 0, height: 0 };
  }
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    width?: number;
    height?: number;
    className?: string;
    children?: Snippet;
  }

  const {
    width = 0,
    height = 0,
    className = '',
    children
  }: Props = $props();
</script>

<div
  class="base-component {className}"
  style:width={width > 0 ? `${width}px` : undefined}
  style:height={height > 0 ? `${height}px` : undefined}
>
  {#if children}
    {@render children()}
  {/if}
</div>

<style>
  .base-component {
    font-family: var(--font-mono, 'Courier New', 'Consolas', monospace);
    display: block;
    position: absolute;
    pointer-events: auto;
  }
</style>
