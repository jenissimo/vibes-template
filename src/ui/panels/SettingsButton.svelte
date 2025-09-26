<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { animations } from '@utils/animations';
  import { panelPositioningService } from '@engine/ui';
  import Icon from '@ui/base/Icon.svelte';
  import { gameEventBus } from '@/game/events';
  
  let buttonElement: HTMLElement;
  
  onMount(() => {
    if (buttonElement) {
      // Регистрируем кнопку в сервисе позиционирования
      panelPositioningService.registerPanel({
        id: 'settings-button',
        anchor: 'TR',
        offsetX: 16, // 4 * 4px = 16px (top-4)
        offsetY: 0, // 4 * 4px = 16px (right-4)
        element: buttonElement
      });
    }
  });
  
  onDestroy(() => {
    panelPositioningService.unregisterPanel('settings-button');
  });
  
  function handleSettingsClick() {
    // Отправляем событие через GameEventBus
    gameEventBus.emit('settings-open');
  }
  
  function animateButton(event: MouseEvent) {
    const button = event.currentTarget as HTMLElement;
    if (button) {
      animations.buttonPress(button);
    }
  }
</script>

<button
  bind:this={buttonElement}
  class="settings-button"
  onclick={(e) => {
    animateButton(e);
    handleSettingsClick();
  }}
  aria-label="Settings"
>
  <Icon 
    name="settings" 
    size="lg" 
    color="neon-green"
    class="settings-icon"
  />
</button>

<style lang="postcss">
  @reference "@/styles/theme.css";
  
  .settings-button {
    @apply z-50;
    @apply w-12 h-12;
    @apply bg-black/80 backdrop-blur-sm;
    @apply border border-neon-green/30 rounded-full;
    @apply flex items-center justify-center;
    @apply cursor-pointer transition-all duration-200;
    @apply hover:bg-neon-green/20 hover:border-neon-green/60;
    @apply active:scale-95;
    @apply pointer-events-auto;
  }
</style>
