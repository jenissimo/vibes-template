<script lang="ts">
  import { animations } from '@/utils/animations';
  import Icon from '@ui/base/Icon.svelte';
  
  // Template state - простые булевы значения для демонстрации
  let hasUpgrades = $state(true);
  let hasActiveCrafts = $state(false);
  let hasWarehouseItems = $state(true);
  
  // Game modes that will be unlocked progressively
  const gameModes = $derived([
    {
      id: 'warehouse',
      icon: 'warehouse',
      label: 'Warehouse',
      unlocked: true,
      color: 'neon-green' as const,
      hasNotifications: hasWarehouseItems
    },
    {
      id: 'upgrades',
      icon: 'upgrades',
      label: 'Upgrades', 
      unlocked: true,
      color: 'neon-blue' as const,
      hasNotifications: hasUpgrades
    },
    {
      id: 'production',
      icon: 'production',
      label: 'Production',
      unlocked: true,
      color: 'neon-orange' as const,
      hasNotifications: hasActiveCrafts
    },
    {
      id: 'research',
      icon: 'research',
      label: 'Research',
      unlocked: false,
      color: 'neon-purple' as const
    },
    {
      id: 'market',
      icon: 'market',
      label: 'Market',
      unlocked: false,
      color: 'neon-pink' as const
    }
  ]);
  
  function handleModeClick(modeId: string) {
    // Template function - просто логируем
    console.log('🎮 Mode clicked:', modeId);
  }
  
  function animateButton(event: MouseEvent) {
    const button = event.currentTarget as HTMLElement;
    if (button) {
      animations.buttonPress(button);
    }
  }
</script>

<div class="bottom-action-bar">
  <div class="action-buttons">
    {#each gameModes as mode (mode.id)}
      <button
        class="action-button"
        class:unlocked={mode.unlocked}
        class:locked={!mode.unlocked}
        disabled={!mode.unlocked}
        onclick={(e) => {
          if (mode.unlocked) {
            animateButton(e);
            handleModeClick(mode.id);
          }
        }}
        aria-label={mode.label}
      >
        <div class="action-icon">
          <Icon 
            name={mode.icon} 
            size="lg" 
            color={mode.unlocked ? mode.color : 'gray'}
            variant="action"
            hover="glow"
          />
        </div>
        {#if !mode.unlocked}
          <div class="lock-overlay">
            <Icon name="lock" size="sm" color="gray" />
          </div>
        {/if}
        
        {#if mode.hasNotifications}
          <div class="notification-badge">
            <div class="notification-dot"></div>
          </div>
        {/if}
      </button>
    {/each}
  </div>
</div>

<style lang="postcss">
  @reference "@/styles/theme.css";
  
  .bottom-action-bar {
    @apply fixed bottom-0 left-0 right-0 z-50;
    @apply bg-dark-darker/95 backdrop-blur-sm;
    @apply border-t border-neon-green/30;
    @apply pointer-events-auto;
  }
  
  .action-buttons {
    @apply flex;
    @apply h-16;
    @apply overflow-hidden;
  }
  
  .action-button {
    @apply relative flex-1;
    @apply flex items-center justify-center;
    @apply transition-all duration-200;
    @apply cursor-pointer;
    @apply active:scale-95;
    @apply border-r border-neon-green/20;
  }
  
  .action-button:last-child {
    @apply border-r-0;
  }
  
  .action-button.unlocked {
    @apply bg-dark-bg/50;
    @apply hover:bg-neon-green/10;
    @apply hover:shadow-inner hover:shadow-neon-green/20;
  }
  
  .action-button.locked {
    @apply bg-gray-800/50;
    @apply cursor-not-allowed;
  }
  
  .action-icon {
    @apply flex items-center justify-center;
  }
  
  .lock-overlay {
    @apply absolute inset-0;
    @apply flex items-center justify-center;
    @apply bg-black/60;
    @apply text-sm;
  }

  .notification-badge {
    @apply absolute top-1 right-1;
    @apply pointer-events-none;
  }

  .notification-dot {
    @apply w-2 h-2;
    @apply bg-neon-green rounded-full;
    @apply animate-pulse;
    @apply shadow-lg shadow-neon-green/50;
  }
</style>
