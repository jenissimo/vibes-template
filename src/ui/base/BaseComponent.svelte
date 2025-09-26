<script lang="ts">
  export let width: number = 0;
  export let height: number = 0;
  export let className: string = '';
  
  // Get dimensions method
  export function getDimensions(): { width: number; height: number } {
    // If dimensions are set as props, use them
    if (width > 0 && height > 0) {
      return { width, height };
    }
    
    // Otherwise use real DOM dimensions
    const element = document.querySelector(`.${className}`) as HTMLElement;
    if (element) {
      const rect = element.getBoundingClientRect();
      return {
        width: rect.width || 0,
        height: rect.height || 0
      };
    }
    
    return { width: 0, height: 0 };
  }
</script>

<div 
  class="base-component {className}"
  style:width={width > 0 ? `${width}px` : undefined}
  style:height={height > 0 ? `${height}px` : undefined}
>
  <slot />
</div>

<style>
  .base-component {
    font-family: var(--font-mono, 'Courier New', 'Consolas', monospace);
    display: block;
    position: absolute;
    pointer-events: auto;
  }
</style>
