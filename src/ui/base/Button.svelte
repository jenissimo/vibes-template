<script lang="ts">
  import type { Snippet } from 'svelte';
  import { playClick } from '@/utils/uiSfx';

  interface Props {
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    type?: 'button' | 'submit' | 'reset';
    /** Set to `true` to suppress the default UI click SFX (e.g. for silent/stealth buttons). */
    silent?: boolean;
    onclick?: (event: MouseEvent) => void;
    children?: Snippet;
  }

  const {
    variant = 'primary',
    disabled = false,
    size = 'md',
    fullWidth = false,
    type = 'button',
    silent = false,
    onclick,
    children
  }: Props = $props();

  function handleClick(event: MouseEvent) {
    if (!disabled) {
      if (!silent) playClick();
      onclick?.(event);
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !disabled) {
      onclick?.(event as unknown as MouseEvent);
    }
  }

  const buttonClasses = $derived([
    'cursor-pointer',
    'btn',
    `btn-${variant}`,
    disabled ? 'btn-disabled' : '',
    fullWidth ? 'w-full' : '',
    size === 'sm' ? 'px-2 py-1 text-xs' : '',
    size === 'lg' ? 'px-4 py-3 text-base' : ''
  ].filter(Boolean).join(' '));
</script>

<button
  {type}
  class={buttonClasses}
  {disabled}
  onclick={handleClick}
  onkeydown={handleKeydown}
>
  {#if children}
    {@render children()}
  {/if}
</button>

<style>
  @reference "@/styles/theme.css";
</style>
