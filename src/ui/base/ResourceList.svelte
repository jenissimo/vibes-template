<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { RESOURCE_ICON_SVG_PATHS } from '@assets/svg-primitives';
  
  export let resources: Array<{
    id: string;
    label: string;
    amount: number;
  }> = [];
  
  const dispatch = createEventDispatcher();
  
  function handleResourceClick(resource: any, event: MouseEvent) {
    dispatch('resource-click', { resource, event });
  }
  
  // Get SVG path for resource icon
  function getResourceIconPath(resourceId: string): string {
    return RESOURCE_ICON_SVG_PATHS[resourceId as keyof typeof RESOURCE_ICON_SVG_PATHS] || resourceId;
  }
</script>

<div class="resource-list">
  {#each resources as resource (resource.id)}
    <div class="resource-item">
      <button 
        type="button"
        class="resource-icon" 
        on:click={(e) => handleResourceClick(resource, e)}
        aria-label="Animate {resource.label} resource"
      >
        <img 
          src={getResourceIconPath(resource.id)} 
          alt={resource.label}
          class="resource-icon-svg"
        />
      </button>
      <div class="resource-info">
        <span class="resource-label">{resource.label}</span>
        <span class="resource-amount">{resource.amount.toLocaleString()}</span>
      </div>
    </div>
  {/each}
</div>

<style lang="postcss">
  @reference "@/styles/theme.css";
  
  .resource-list {
    @apply flex flex-col gap-2;
  }
  
  .resource-item {
    @apply flex items-center gap-3 p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors;
  }
  
  .resource-icon {
    @apply p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500;
  }
  
  .resource-icon-svg {
    @apply w-6 h-6;
    filter: drop-shadow(0 0 4px rgba(0, 255, 255, 0.3));
  }
  
  .resource-info {
    @apply flex flex-col;
  }
  
  .resource-label {
    @apply text-sm font-medium text-gray-300;
  }
  
  .resource-amount {
    @apply text-lg font-bold text-white;
  }
</style>
