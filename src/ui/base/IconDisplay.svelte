<script lang="ts">
  import creditIcon from '@/assets/icons/credit.png';
  
  let {
    cost,
    size = 'md',
    showIcons = true,
    showLabels = true,
    compact = false
  } = $props<{
    cost: {
      coins?: number;
      resources?: Array<{
        itemId: string;
        amount: number;
      }>;
    };
    size?: 'sm' | 'md' | 'lg';
    showIcons?: boolean;
    showLabels?: boolean;
    compact?: boolean;
  }>();
  
  // Форматируем количество
  function formatAmount(amount: number): string {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toLocaleString();
  }
  
  // Получаем иконку для ресурса (шаблонная функция)
  function getItemIcon(itemId: string): string {
    // В шаблоне используем только кредиты
    if (itemId === 'credits') {
      return creditIcon;
    }
    return creditIcon; // Fallback на кредиты
  }
  
  // Размеры для разных размеров компонента
  const sizeClasses = {
    sm: {
      container: 'text-xs',
      icon: 'w-3 h-3',
      amount: 'text-xs',
      label: 'text-xs'
    },
    md: {
      container: 'text-sm',
      icon: 'w-4 h-4',
      amount: 'text-sm',
      label: 'text-sm'
    },
    lg: {
      container: 'text-base',
      icon: 'w-5 h-5',
      amount: 'text-base',
      label: 'text-base'
    }
  };
  
  const currentSize = $derived(sizeClasses[size as keyof typeof sizeClasses]);
</script>

<div class="cost-display {currentSize.container}">
  <!-- Монеты -->
  {#if cost.coins && cost.coins > 0}
    <div class="cost-item cost-coins">
      {#if showIcons}
        <img
          src={getItemIcon('credits')}
          alt="credits"
          class="{currentSize.icon} object-contain"
          style="filter: drop-shadow(0 0 2px rgba(255, 255, 0, 0.4));"
        />
      {/if}
      
      <span class="cost-amount {currentSize.amount}">
        {formatAmount(cost.coins)}
      </span>
      
      {#if showLabels}
        <span class="cost-label {currentSize.label}">credits</span>
      {/if}
    </div>
  {/if}
  
  <!-- Ресурсы -->
  {#if cost.resources && cost.resources.length > 0}
    <div class="cost-resources" class:cost-resources--compact={compact}>
      {#each cost.resources as resource}
        <div class="cost-item cost-resource">
          {#if showIcons}
            <img
              src={getItemIcon(resource.itemId)}
              alt={resource.itemId}
              class="{currentSize.icon} object-contain"
              style="filter: drop-shadow(0 0 2px rgba(0, 255, 255, 0.4));"
            />
          {/if}
          
          <span class="cost-amount {currentSize.amount}">
            {formatAmount(resource.amount)}
          </span>
          
          {#if showLabels}
            <span class="cost-label {currentSize.label}">
              {resource.itemId}
            </span>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
  
  <!-- Если нет стоимости -->
  {#if (!cost.coins || cost.coins === 0) && (!cost.resources || cost.resources.length === 0)}
    <div class="cost-item cost-free">
      <span class="cost-amount {currentSize.amount} text-neon-green">
        Free
      </span>
    </div>
  {/if}
</div>

<style lang="postcss">
  @reference "@/styles/theme.css";
  
  .cost-display {
    @apply flex flex-wrap items-center gap-2;
  }
  
  .cost-item {
    @apply flex items-center gap-1;
    @apply bg-dark-bg/50;
    @apply border border-neon-cyan/30;
    @apply rounded-md;
    @apply px-2 py-1;
    @apply transition-all duration-200;
    @apply font-mono font-bold;
  }
  
  
  .cost-coins {
    @apply text-neon-cyan;
    @apply border-neon-cyan/50;
    @apply bg-neon-cyan/10;
  }
  
  .cost-resource {
    @apply text-neon-blue;
    @apply border-neon-blue/50;
    @apply bg-neon-blue/10;
  }
  
  .cost-free {
    @apply text-neon-green;
    @apply border-neon-green/50;
    @apply bg-neon-green/10;
  }
  
  .cost-resources {
    @apply flex flex-wrap gap-1;
  }
  
  .cost-resources--compact {
    @apply gap-0.5;
  }
  
  .cost-resources--compact .cost-item {
    @apply px-1.5 py-0.5;
    @apply text-xs;
  }
  
  .cost-amount {
    @apply font-bold;
    @apply whitespace-nowrap;
  }
  
  .cost-label {
    @apply opacity-80;
    @apply truncate;
    @apply max-w-20;
  }
  
  /* Hover эффекты */
  .cost-item:hover {
    @apply border-neon-cyan/60;
    @apply bg-neon-cyan/20;
  }
  
</style>
