<script lang="ts">
  import BottomActionBar from '@ui/panels/BottomActionBar.svelte';
  import SettingsButton from '@ui/panels/SettingsButton.svelte';
  import SettingsModal from '@ui/modals/SettingsModal.svelte';
  import SpectorDebugPanel from '@ui/components/SpectorDebugPanel.svelte';
  import ResourcePanel from '@ui/components/ResourcePanel.svelte';
  import { gameEventBus } from '@/game/events';
  import { onMount, onDestroy } from 'svelte';
  import { setAppMode } from '@/stores/ui/appState';
  let unsubscribe: (() => void)[] = [];
    
  onMount(() => {
    // Подписываемся на игровые события от BottomActionBar
    unsubscribe.push(
      gameEventBus.on('mode-click', handleModeClick),
    );
  });
  
  onDestroy(() => {
    // Отписываемся от всех событий
    unsubscribe.forEach(fn => fn());
  });
  
  function handleModeClick(data: { modeId: string }) {
    const { modeId } = data;
    console.log('Mode clicked:', modeId);
    
    // Обрабатываем клики по режимам
    switch (modeId) {
      case 'upgrades':
        break;
      case 'warehouse':
        break;
      case 'production':
        break;
      case 'research':
        break;
      case 'market':
        break;
      default:
        console.log('Unknown mode:', modeId);
    }
  }
  
</script>

<div class="game-hud">
  <div class="absolute top-4 left-32 z-50 flex gap-2">
    <button class="dev-button" on:click={() => setAppMode('scene-editor')}>
      Scene Editor
    </button>
=  </div>
  <SettingsButton />
  <!-- Панель ресурсов -->
  <ResourcePanel />
  <!-- Панель отладки Spector.js -->
  <SpectorDebugPanel />
  <!-- Нижняя панель действий -->
  <BottomActionBar />
  
  <!-- Модальные окна -->
  <SettingsModal />
</div>

<style lang="postcss">
  @reference "@/styles/theme.css";
  
  .game-hud {
    @apply w-full h-full;
    @apply flex flex-col;
    @apply relative;
    @apply overflow-hidden;
  }

  .dev-button {
    background: rgba(128, 0, 128, 0.7);
    color: white;
    border: 1px solid var(--color-neon-pink);
    padding: 5px 10px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 12px;
  }
</style>
