<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { tick } from "svelte";
  import { animations } from "@/utils/animations";
  import { panelPositioningService } from "@/engine/ui";
  import creditIcon from "@/assets/icons/credit.png";
  import { GameEventBus } from "@/game/events/GameEventBus";
  let panelElement: HTMLElement;
  let credits = $state(1000); // Template value

  onMount(() => {
    if (panelElement) {
      // Регистрируем панель в сервисе позиционирования
      panelPositioningService.registerPanel({
        id: "resource-panel",
        anchor: "TL",
        offsetX: 16, // 4 * 4px = 16px (top-4)
        offsetY: 0, // 4 * 4px = 16px (left-4)
        element: panelElement,
      });

      // Анимируем появление
      animations.panelSlideIn(panelElement, "left");

      if (panelPositioningService.hasPanel("resource-panel")) {
        void tick().then(() => {
          panelPositioningService.refreshPanel("resource-panel");
        });
      }
    }

    // Subscribe to add credits event
    GameEventBus.getInstance().on('add-credits', handleAddCredits);
  });

  onDestroy(() => {
    panelPositioningService.unregisterPanel("resource-panel");
    GameEventBus.getInstance().off('add-credits', handleAddCredits);
  });
  

  function handleAddCredits(data: { amount: number }) {
    credits += data.amount;
  }

  // Dev function to add coins (for testing)
  function handleCoinClick(event: MouseEvent) {
    event.stopPropagation();
    credits += 10;
    const target = event.currentTarget as HTMLElement;
    if (target) {
      animations.resourceGain(target);
    }
  }
</script>

<div bind:this={panelElement} class="resource-panel">
  <button
    class="resource-item coins"
    onclick={handleCoinClick}
    type="button"
    title="Credits"
    data-resource-type="credits"
  >
    <div class="resource-icon">
      <img
        src={creditIcon}
        alt="credits"
        class="resource-icon-svg"
      />
    </div>
    <div class="resource-amount">
      ${credits}
    </div>
  </button>
</div>

<style lang="postcss">
  @reference "@/styles/theme.css";

  .resource-panel {
    @apply z-50;
    @apply flex flex-col gap-1;
    @apply pointer-events-auto;
    @apply min-h-[40px];
  }

  .resource-item {
    @apply flex items-center gap-2;
    @apply cursor-pointer transition-all duration-200;
    @apply hover:bg-neon-yellow/10 rounded-md;
    @apply px-2 py-1 min-w-[80px];
    @apply bg-black/80 backdrop-blur-sm border border-neon-yellow/40;
    @apply relative overflow-hidden;
  }

  .resource-icon {
    @apply w-5 h-5 flex items-center justify-center;
    @apply flex-shrink-0;
  }

  .resource-icon-svg {
    @apply w-4 h-4 object-contain;
    filter: drop-shadow(0 0 3px rgba(255, 255, 0, 0.4));
  }

  .resource-amount {
    @apply text-neon-yellow font-mono text-sm font-bold;
    @apply text-left flex-shrink-0;
  }

</style>
