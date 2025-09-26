<!-- Scene Graph Panel -->
<script lang="ts">
  import { sceneState, selectObject, addObject } from '../stores/sceneEditorStore';
  import { ALL_PREFABS, createObjectFromPrefab } from '../prefabs';
  import Button from '@/ui/base/Button.svelte';
  import Icon from '@/ui/base/Icon.svelte';
  import { nanoid } from 'nanoid';

  let expandedNodes = new Set<string>();
  
  // Реактивная переменная для корневых объектов
  $: rootObjects = Object.values($sceneState.objects).filter(obj => !obj.parent);

  function toggleNode(nodeId: string) {
    if (expandedNodes.has(nodeId)) {
      expandedNodes.delete(nodeId);
    } else {
      expandedNodes.add(nodeId);
    }
    expandedNodes = expandedNodes; // trigger reactivity
  }

  function handleObjectSelect(objectId: string) {
    selectObject(objectId);
  }

  function handleAddPrefab(prefabId: string) {
    const object = createObjectFromPrefab(prefabId, nanoid());
    if (object) {
      addObject(object);
    }
  }

  function renderObjectNode(object: any, depth = 0) {
    const isExpanded = expandedNodes.has(object.id);
    const hasChildren = object.children && object.children.length > 0;
    const isSelected = $sceneState.selectedObjectId === object.id;

    return {
      object,
      depth,
      isExpanded,
      hasChildren,
      isSelected
    };
  }
</script>

<div class="scene-graph h-full flex flex-col">
  <!-- Header -->
  <div class="p-4 border-b border-gray-700">
    <h3 class="text-lg font-semibold text-white mb-2">Scene Graph</h3>
    
    <!-- Add Object Buttons -->
    <div class="space-y-2">
      <div class="text-sm text-gray-400 mb-2">Add Object:</div>
      {#each ALL_PREFABS as prefab}
        <Button
          variant="secondary"
          size="sm"
          on:click={() => handleAddPrefab(prefab.id)}
        >
          <Icon name={prefab.icon} size="sm" />
          {prefab.name}
        </Button>
      {/each}
    </div>
  </div>

  <!-- Object Tree -->
  <div class="flex-1 overflow-y-auto p-2">
    {#each rootObjects as object (object.id)}
      {@const node = renderObjectNode(object)}
      <div class="object-node">
        <div
          class="w-full"
          style="padding-left: {node.depth * 16 + 8}px"
        >
          <div class="flex items-center gap-2">
            {#if node.hasChildren}
              <button
                type="button"
                class="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-white"
                on:click={() => toggleNode(node.object.id)}
                aria-expanded={node.isExpanded}
                aria-label={node.isExpanded ? 'Collapse' : 'Expand'}
              >
                <Icon name={node.isExpanded ? 'chevron-down' : 'chevron-right'} size="sm" />
              </button>
            {:else}
              <div class="w-4"></div>
            {/if}

            <button
              type="button"
              class="flex-1 flex items-center gap-2 p-2 rounded transition-colors text-left
                     {node.isSelected ? 'bg-neon-purple/20 text-neon-purple' : 'hover:bg-gray-700/50'}"
              on:click={() => handleObjectSelect(node.object.id)}
            >
              <Icon name={node.object.type === 'sprite' ? 'sprite' : 'space-bg'} size="sm" />
              <span class="text-sm flex-1 truncate">{node.object.name}</span>
              <span class="text-xs px-2 py-1 rounded bg-gray-600 text-gray-300">
                {node.object.type}
              </span>
            </button>
          </div>
        </div>

        <!-- Children -->
        {#if node.hasChildren && node.isExpanded}
          {#each node.object.children as childId}
            {@const child = $sceneState.objects[childId]}
            {#if child}
              {@const childNode = renderObjectNode(child, node.depth + 1)}
              <div class="object-node" style="padding-left: {childNode.depth * 16 + 8}px">
                <button
                  type="button"
                  class="w-full flex items-center gap-2 p-2 rounded transition-colors text-left
                         {childNode.isSelected ? 'bg-neon-purple/20 text-neon-purple' : 'hover:bg-gray-700/50'}"
                  on:click={() => handleObjectSelect(childNode.object.id)}
                >
                  <div class="w-4"></div>
                  <Icon name={childNode.object.type === 'sprite' ? 'sprite' : 'space-bg'} size="sm" />
                  <span class="text-sm flex-1 truncate">{childNode.object.name}</span>
                  <span class="text-xs px-2 py-1 rounded bg-gray-600 text-gray-300">
                    {childNode.object.type}
                  </span>
                </button>
              </div>
            {/if}
          {/each}
        {/if}
      </div>
    {/each}

    {#if rootObjects.length === 0}
      <div class="text-center text-gray-500 py-8">
        <Icon name="empty" size="lg" class="mx-auto mb-2" />
        <p class="text-sm">No objects in scene</p>
        <p class="text-xs">Add objects using buttons above</p>
      </div>
    {/if}
  </div>
</div>
