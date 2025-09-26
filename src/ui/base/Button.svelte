<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let variant: 'primary' | 'secondary' | 'danger' | 'success' = 'primary';
  export let disabled: boolean = false;
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let fullWidth: boolean = false;
  export let type: 'button' | 'submit' | 'reset' = 'button';
  
  const dispatch = createEventDispatcher();
  
  function handleClick(event: MouseEvent) {
    if (!disabled) {
      dispatch('click', event);
    }
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !disabled) {
      dispatch('click', event as any);
    }
  }
  
  $: buttonClasses = [
    'cursor-pointer',
    'btn',
    `btn-${variant}`,
    disabled ? 'btn-disabled' : '',
    fullWidth ? 'w-full' : '',
    size === 'sm' ? 'px-2 py-1 text-xs' : '',
    size === 'lg' ? 'px-4 py-3 text-base' : ''
  ].filter(Boolean).join(' ');
</script>

<button
  {type}
  class={buttonClasses}
  {disabled}
  on:click={handleClick}
  on:keydown={handleKeydown}
>
  <slot />
</button>

<style>
  @reference "@/styles/theme.css";
</style>
