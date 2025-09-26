<!-- Scene Viewport -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { sceneState, setViewport } from '../stores/sceneEditorStore';
  import { eventBus } from '@/engine/events/EventBus';

  // Viewport state
  let isDragging = false;
  let lastMouseX = 0;
  let lastMouseY = 0;
  let unsubscribeEvents: (() => void)[] = [];

  onMount(() => {
    // Подписываемся на все нужные события через EventBus
    unsubscribeEvents.push(
      eventBus.on('mousedown', handleMouseDown),
      eventBus.on('mousemove', handleMouseMove),
      eventBus.on('mouseup', handleMouseUp),
      eventBus.on('wheel', handleWheel)
    );
  });

  onDestroy(() => {
    unsubscribeEvents.forEach(unsub => unsub());
  });

  function handleMouseDown(event: MouseEvent) {
    // Проверяем, что клик был в области viewport
    const target = event.target as HTMLElement;
    if (!target.closest('.scene-viewport')) return;
    
    isDragging = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
    event.preventDefault();
  }

  function handleMouseMove(event: MouseEvent) {
    if (!isDragging) return;

    const deltaX = event.clientX - lastMouseX;
    const deltaY = event.clientY - lastMouseY;

    const current = sceneState.get();
    setViewport(
      current.viewport.x + deltaX,
      current.viewport.y + deltaY,
      current.viewport.zoom
    );

    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
  }

  function handleMouseUp() {
    isDragging = false;
  }

  function handleWheel(event: WheelEvent) {
    // Проверяем, что скролл был в области viewport
    const target = event.target as HTMLElement;
    if (!target.closest('.scene-viewport')) return;
    
    event.preventDefault();
    
    const current = sceneState.get();
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, current.viewport.zoom * zoomFactor));
    
    setViewport(current.viewport.x, current.viewport.y, newZoom);
  }
</script>

<div class="scene-viewport relative w-full h-full overflow-hidden cursor-grab {isDragging ? 'cursor-grabbing' : ''}">

  <!-- Viewport Info Overlay -->
  <div class="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white text-sm">
    <div class="space-y-1">
      <div>Viewport: {$sceneState.viewport.x.toFixed(0)}, {$sceneState.viewport.y.toFixed(0)}</div>
      <div>Zoom: {($sceneState.viewport.zoom * 100).toFixed(0)}%</div>
      <div>Objects: {Object.keys($sceneState.objects).length}</div>
    </div>

  </div>

  <!-- Grid Info -->
  {#if $sceneState.grid.enabled}
    <div class="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-2 text-white text-xs">
      Grid: {$sceneState.grid.size}px
    </div>
  {/if}
</div>
