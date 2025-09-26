<script lang="ts">
  import { profileStore } from '@/stores/game/profile';
  import { itemsDB } from '@/game/database';
  import { getItemIconUrl } from '@/assets/icons';
  
  export let showLabel: boolean = true;
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let className: string = '';
  
  // Reactive statement to get current currency
  $: currencyItems = Object.values($profileStore.inventory.items)
    .filter(item => item.type === 'currency');
  $: totalCredits = currencyItems.reduce((sum, item) => sum + item.quantity, 0);
  
  function getItemIcon(itemId: string): string {
    const iconPath = itemsDB.getItemIcon(itemId);
    return getItemIconUrl(iconPath);
  }
  
  function formatQuantity(quantity: number): string {
    if (quantity >= 1000000) {
      return `${(quantity / 1000000).toFixed(1)}M`;
    } else if (quantity >= 1000) {
      return `${(quantity / 1000).toFixed(1)}K`;
    }
    return quantity.toString();
  }
  
  // Size classes
  const sizeClasses = {
    sm: {
      container: 'px-2 py-1 min-w-[60px]',
      icon: 'w-4 h-4',
      text: 'text-xs',
      label: 'text-xs'
    },
    md: {
      container: 'px-3 py-2 min-w-[80px]',
      icon: 'w-5 h-5',
      text: 'text-sm',
      label: 'text-sm'
    },
    lg: {
      container: 'px-4 py-3 min-w-[100px]',
      icon: 'w-6 h-6',
      text: 'text-base',
      label: 'text-base'
    }
  };
</script>

<div class="currency-panel {className} {sizeClasses[size].container}" class:currency-panel--with-label={showLabel}>
  <div class="flex items-center gap-2">
    <div class="flex items-center justify-center flex-shrink-0">
      <img
        src={getItemIcon('credits')}
        alt="credits"
        class="{sizeClasses[size].icon} object-contain"
        style="filter: drop-shadow(0 0 3px rgba(255, 255, 0, 0.4));"
      />
    </div>
    
    <div class="flex flex-col items-start min-w-0">
      <div class="text-neon-yellow font-mono {sizeClasses[size].text} font-bold text-left">
        {formatQuantity(totalCredits)}
      </div>
      {#if showLabel}
        <div class="text-gray-400 {sizeClasses[size].label} font-medium">
          Credits
        </div>
      {/if}
    </div>
  </div>
</div>

<style lang="postcss">
  @reference "@/styles/theme.css";
  
  .currency-panel {
    @apply flex items-center;
    @apply cursor-pointer transition-all duration-200;
    @apply hover:bg-neon-yellow/10;
    @apply rounded-md;
    @apply bg-black/80 backdrop-blur-sm;
    @apply border border-neon-yellow/40;
    @apply relative overflow-hidden;
  }
  
  .currency-panel--with-label {
    @apply py-3;
  }
  
  .currency-panel:hover {
    @apply border-neon-yellow/60;
    @apply shadow-lg shadow-neon-yellow/10;
  }
  
  .currency-panel:hover img {
    filter: drop-shadow(0 0 6px rgba(255, 255, 0, 0.6)) !important;
  }
</style>
