<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title?: string;
    subtitle?: string;
    description?: string;
    hoverable?: boolean;
    className?: string;
    children?: Snippet;
  }

  const {
    title = '',
    subtitle = '',
    description = '',
    hoverable = true,
    className = '',
    children
  }: Props = $props();

  const cardClasses = $derived([
    'card',
    !hoverable ? 'hover:border-neon-blue/30 hover:shadow-none' : '',
    className
  ].filter(Boolean).join(' '));
</script>

<div class={cardClasses}>
  {#if title || subtitle}
    <div class="card-header">
      {#if title}
        <h3 class="card-title">{title}</h3>
      {/if}
      {#if subtitle}
        <div class="card-subtitle">{subtitle}</div>
      {/if}
    </div>
  {/if}

  {#if description}
    <p class="card-description">{description}</p>
  {/if}

  <div class="card-content">
    {#if children}
      {@render children()}
    {/if}
  </div>
</div>

<style lang="postcss">
  @reference "@/styles/theme.css";

  .card-content {
    @apply flex flex-col gap-2;
  }
</style>
