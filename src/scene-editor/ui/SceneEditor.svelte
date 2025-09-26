<!-- Scene Editor Main UI -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  // import { sceneState, editorMode, setEditorMode } from '../stores/sceneEditorStore';
  import SceneGraph from './SceneGraph.svelte';
  import SceneViewport from './SceneViewport.svelte';
  import Inspector from './Inspector.svelte';
  import Toolbar from './Toolbar.svelte';

  onMount(() => {
    // Scene Editor использует flexbox layout, не нужна система позиционирования
    // panelPositioningService предназначена для overlay панелей в игре
  });

  onDestroy(() => {
    // Ничего не нужно отменять, так как не регистрируем панели
  });
</script>

<div class="scene-editor h-full w-full relative overflow-hidden">
  <!-- Toolbar -->
  <div class="toolbar-panel relative z-50 h-16">
    <Toolbar />
  </div>

  <!-- Main Layout -->
  <div class="flex relative z-40" style="height: calc(100% - 64px);">
    <!-- Left Panel: Scene Graph -->
    <div class="scene-graph-panel w-80 bg-gray-900/90 backdrop-blur-sm border-r border-neon-purple/20 flex-shrink-0 relative z-50">
      <SceneGraph />
    </div>

    <!-- Center: Scene Viewport -->
    <div class="flex-1 relative z-10">
      <SceneViewport />
    </div>

    <!-- Right Panel: Inspector -->
    <div class="inspector-panel w-80 bg-gray-900/90 backdrop-blur-sm border-l border-neon-purple/20 flex-shrink-0 relative z-50">
      <Inspector />
    </div>
  </div>
</div>

<style>
  .scene-editor {
    font-family: 'Rajdhani', sans-serif;
    color: white;
  }
  
  .toolbar-panel {
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid rgba(0, 153, 255, 0.3);
  }
  
  .scene-graph-panel,
  .inspector-panel {
    height: 100%;
    overflow-y: auto;
  }
</style>
