<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { afterUpdate } from 'svelte';
  import { animations } from '@utils/animations';
  
  export let isOpen: boolean = false;
  export let title: string = '';
  export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  export let closeOnBackdrop: boolean = true;
  export let closeOnEscape: boolean = true;
  export let animated: boolean = true;
  export let maxHeightVh: number = 90;
  
  const dispatch = createEventDispatcher();
  let modalElement: HTMLElement;
  let containerElement: HTMLElement;
  let isAnimating = false;
  
  function handleClose() {
    if (isAnimating) return;
    
    if (animated && containerElement && modalElement) {
      isAnimating = true;
      // Анимируем одновременно контейнер и backdrop
      Promise.all([
        animations.modalExit(containerElement),
        animations.backdropExit(modalElement)
      ]).then(() => {
        dispatch('close');
        isAnimating = false;
      });
    } else {
      dispatch('close');
    }
  }
  
  function handleBackdropClick(event: MouseEvent) {
    if (closeOnBackdrop && event.target === modalElement) {
      handleClose();
    }
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (closeOnEscape && event.key === 'Escape') {
      handleClose();
    }
  }
  
  function animateButton(event: MouseEvent) {
    const button = event.currentTarget as HTMLElement;
    if (button) {
      animations.buttonPress(button);
    }
  }
  
  $: modalSizeClasses = {
    'sm': 'w-[400px]',
    'md': 'w-[600px]',
    'lg': 'w-[800px]',
    'xl': 'w-[1000px]'
  }[size];
  
  // Animate modal entrance
  afterUpdate(() => {
    if (isOpen && containerElement && modalElement && animated) {
      // Анимируем одновременно контейнер и backdrop
      animations.modalEnter(containerElement);
      animations.backdropEnter(modalElement);
    }
  });
  
  // Focus modal when opened
  afterUpdate(() => {
    if (isOpen && containerElement) {
      containerElement.focus();
    }
  });
</script>

{#if isOpen}
  <div
    bind:this={modalElement}
    class="modal-backdrop"
    on:click={handleBackdropClick}
    on:keydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby={title ? 'modal-title' : undefined}
    tabindex="-1"
  >
    <div 
      bind:this={containerElement}
      class="modal-container {modalSizeClasses}" 
      style="pointer-events: auto; max-height: {maxHeightVh}vh;"
      tabindex="-1"
    >
      {#if title}
        <div class="modal-header">
          <h2 id="modal-title" class="modal-title">{title}</h2>
          <button 
            class="close-button cursor-pointer" 
            on:click={handleClose}
            on:click={(e) => animateButton(e)}
            aria-label="Close modal"
          >
            <svg class="close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      {/if}
      
      <div class="modal-content">
        <slot />
      </div>
    </div>
  </div>
{/if}

<style lang="postcss">
  @reference "@/styles/theme.css";
  
  .modal-backdrop {
    @apply fixed inset-0 z-50;
    @apply backdrop-blur-sm;
    @apply flex items-center justify-center;
    @apply p-4;
    @apply transition-opacity duration-300;
    /* Начальное состояние для анимации */
    background-color: rgba(0, 0, 0, 0);
  }
  
  .modal-container {
    @apply backdrop-blur-md;
    @apply border border-neon-green/30 rounded-lg;
    @apply shadow-2xl;
    @apply pointer-events-auto;
    @apply overflow-hidden;
    @apply flex flex-col;
    @apply bg-gray-900;
    /* Начальное состояние для анимации */
    background-color: rgba(17, 24, 39, 0);
  }
  
  .modal-header {
    @apply flex items-center justify-between;
    @apply p-6 border-b border-gray-700/50;
    @apply flex-shrink-0;
  }
  
  
  .modal-title {
    @apply text-xl font-bold text-white;
    @apply m-0;
  }
  
  .close-button {
    @apply w-8 h-8;
    @apply bg-transparent border-none;
    @apply text-gray-400 hover:text-white;
    @apply cursor-pointer transition-colors duration-200;
    @apply flex items-center justify-center;
    @apply rounded;
    @apply active:scale-95;
  }
  
  .close-icon {
    @apply w-5 h-5;
  }
  
  .modal-content {
    @apply p-6;
    @apply flex-1 overflow-y-auto;
  }
  
  /* Mobile adjustments */
  @media (max-width: 768px) {
    .modal-container {
      @apply mx-2 max-w-sm;
    }
    
    .modal-header,
    .modal-content {
      @apply p-4;
    }
  }
</style>
