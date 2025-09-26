<!-- Scene Editor Toolbar -->
<script lang="ts">
  import { editorMode, setEditorMode, undo, redo, sceneState, setGrid } from '../stores/sceneEditorStore';
  import Button from '@/ui/base/Button.svelte';
  import Icon from '@/ui/base/Icon.svelte';

  const modes = [
    { id: 'select', icon: 'cursor', label: 'Select' },
    { id: 'move', icon: 'move', label: 'Move' },
    { id: 'scale', icon: 'scale', label: 'Scale' },
    { id: 'rotate', icon: 'rotate', label: 'Rotate' }
  ] as const;

  function handleModeChange(mode: string) {
    setEditorMode(mode as any);
  }

  function handleUndo() {
    undo();
  }

  function handleRedo() {
    redo();
  }


  function handleToggleGrid() {
    const current = $sceneState;
    setGrid(!current.grid.enabled);
  }
</script>

<div class="toolbar flex items-center gap-4 p-4 bg-gray-800/90 backdrop-blur-sm border-b border-neon-purple/20">
  <!-- Mode Selector -->
  <div class="flex gap-2">
    {#each modes as mode}
      <Button
        variant={$editorMode === mode.id ? 'primary' : 'secondary'}
        size="sm"
        on:click={() => handleModeChange(mode.id)}
      >
        <Icon name={mode.icon} size="sm" />
        {mode.label}
      </Button>
    {/each}
  </div>

  <!-- Divider -->
  <div class="w-px h-6 bg-gray-600"></div>

  <!-- History Controls -->
  <div class="flex gap-2">
    <Button
      variant="secondary"
      size="sm"
      on:click={handleUndo}
    >
      <Icon name="undo" size="sm" />
      Undo
    </Button>
    <Button
      variant="secondary"
      size="sm"
      on:click={handleRedo}
    >
      <Icon name="redo" size="sm" />
      Redo
    </Button>
  </div>

  <!-- Divider -->
  <div class="w-px h-6 bg-gray-600"></div>

  <!-- Grid Toggle -->
  <Button
    variant={$sceneState.grid.enabled ? 'primary' : 'secondary'}
    size="sm"
    on:click={handleToggleGrid}
  >
    <Icon name="grid" size="sm" />
    Grid
  </Button>

  <!-- Snap Toggle -->
  <Button
    variant="secondary"
    size="sm"
    on:click={() => {/* TODO: toggle snap */}}
  >
    <Icon name="snap" size="sm" />
    Snap
  </Button>

</div>
