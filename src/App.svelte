<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import GameHUD from '@ui/components/GameHUD.svelte';
  import SceneEditor from '@/scene-editor/ui/SceneEditor.svelte';
  import { eventBus } from '@/engine/events/EventBus';
  import { logger } from '@/engine/logging';
  import { layoutState } from '@/stores/ui/layout';
  import { panelPositioningService } from '@/engine/ui';
  import { appMode } from '@/stores/ui/appState';
  
  let unsubscribe: (() => void)[] = [];
  
  onMount(() => {
    logger.debug('🚀 App mounted')
    
    // Подписываемся на события pixi-resize
    unsubscribe.push(
      eventBus.on('pixi-resize', handlePixiResize)
    );
    
    // Dispatch app ready event for game integration
    // Небольшая задержка для стабилизации DOM при HMR
    setTimeout(() => {
      eventBus.emit('app-ready');
      logger.debug('📡 App-ready event emitted', { source: 'App.svelte' });
    }, 50);
  });
  
  onDestroy(() => {
    // Отписываемся от всех событий
    unsubscribe.forEach(fn => fn());
  });
  
  function handlePixiResize(data: { layout: any; gameWidth: number; gameHeight: number; scale: number; scaleUI: number; safe: any; }) {
    const { layout } = data;
    
    layoutState.setKey('currentLayout', layout);
    panelPositioningService.updateLayout(layout);
  }
</script>

<main class="app">
  {#if $appMode === 'game'}
    <GameHUD />
  {:else if $appMode === 'scene-editor'}
    <SceneEditor />
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    background: var(--color-dark-bg);
    font-family: var(--font-mono);
    overflow: hidden;
  }
  
  .app {
    width: 100vw;
    height: 100vh;
    position: relative;
  }
</style>
