<script lang="ts">
  import BaseComponent from './BaseComponent.svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    title?: string;
    width?: number;
    height?: number;
    className?: string;
    children?: Snippet;
  }

  const {
    title = '',
    width = 200,
    height = 100,
    className = '',
    children
  }: Props = $props();
</script>

<BaseComponent {width} {height} {className}>
  <div class="panel-container">
    {#if title}
      <div class="panel-header">
        <h3 class="panel-title">{title}</h3>
      </div>
    {/if}
    <div class="panel-content">
      {#if children}
        {@render children()}
      {/if}
    </div>
  </div>
</BaseComponent>

<style>
  .panel-container {
    background-color: var(--color-dark-bg);
    border: 1px solid var(--color-neon-green);
    border-radius: 0.5rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    backdrop-filter: blur(10px);
  }

  .panel-header {
    border-bottom: 1px solid rgba(0, 255, 153, 0.3);
    padding: 0.5rem;
    flex-shrink: 0;
  }

  .panel-title {
    color: var(--color-neon-green); font-size: 0.875rem; font-family: var(--font-mono); font-weight: bold; margin: 0;
    text-shadow: 0 0 5px var(--color-neon-green);
  }

  .panel-content {
    padding: 0.75rem;
    flex: 1;
    overflow: auto;
  }
</style>
