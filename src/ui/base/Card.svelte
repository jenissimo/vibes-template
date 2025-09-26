<script lang="ts">
  export let title: string = '';
  export let subtitle: string = '';
  export let description: string = '';
  export let hoverable: boolean = true;
  export let className: string = '';
  
  $: cardClasses = [
    'card',
    !hoverable ? 'hover:border-neon-blue/30 hover:shadow-none' : '',
    className
  ].filter(Boolean).join(' ');
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
    <slot />
  </div>
</div>

<style lang="postcss">
  @reference "@/styles/theme.css";
  
  .card-content {
    @apply flex flex-col gap-2;
  }
</style>
