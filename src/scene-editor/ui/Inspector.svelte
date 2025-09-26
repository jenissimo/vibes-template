<!-- Inspector Panel -->
<script lang="ts">
  import { sceneState, updateObject } from '../stores/sceneEditorStore';
  import type { SpriteObject, SpaceBackgroundObject } from '../types';
  import Button from '@/ui/base/Button.svelte';
  import Icon from '@/ui/base/Icon.svelte';
  import Input from '@/ui/base/Input.svelte';
  import Slider from '@/ui/base/Slider.svelte';
  import Checkbox from '@/ui/base/Checkbox.svelte';
  import ColorPicker from '@/ui/base/ColorPicker.svelte';

  // Реактивно получаем выбранный объект
  $: selectedObject = $sceneState.selectedObjectId ? $sceneState.objects[$sceneState.selectedObjectId] : null;

  function updateProperty(property: string, value: any) {
    if (!selectedObject) return;
    
    const updates: any = {};
    if (property.includes('.')) {
      const [parent, child] = property.split('.');
      updates[parent] = { ...(selectedObject as any)[parent], [child]: value };
    } else {
      updates[property] = value;
    }
    
    updateObject(selectedObject.id, updates);
  }

  function updateFilterProperty(filterIndex: number, property: string, value: any) {
    if (!selectedObject || selectedObject.type !== 'sprite') return;
    const sprite = selectedObject as SpriteObject;
    if (!sprite.filters) return;
    
    const newFilters = [...sprite.filters];
    newFilters[filterIndex] = { ...newFilters[filterIndex], [property]: value };
    
    updateObject(sprite.id, { filters: newFilters });
  }

  function addFilter() {
    if (!selectedObject || selectedObject.type !== 'sprite') return;
    const sprite = selectedObject as SpriteObject;
    
    const newFilter = {
      type: 'neonGlowScanline',
      enabled: true,
      glowColor: 0x8b5cf6,
      innerStrength: 0.75,
      outerStrength: 2.5,
      radius: 6.0,
      samples: 12,
      alphaThreshold: 0.01,
      scanIntensity: 0.25,
      scanSpeed: 1.6
    };
    
    const currentFilters = sprite.filters || [];
    updateObject(sprite.id, { filters: [...currentFilters, newFilter] });
  }

  function handleTextureUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !selectedObject || selectedObject.type !== 'sprite') return;
    
    const sprite = selectedObject as SpriteObject;
    
    console.log('🖼️ Starting texture upload:', {
      spriteId: sprite.id,
      currentTexture: sprite.texture,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });
    
    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение');
      return;
    }
    
    // Создаем URL для изображения
    const imageUrl = URL.createObjectURL(file);
    
    console.log('🖼️ Created blob URL:', { url: imageUrl });
    
    // Обновляем текстуру в объекте
    updateObject(sprite.id, { 
      texture: imageUrl,
      textureName: file.name 
    });
    
    console.log('🖼️ Texture uploaded and object updated:', { 
      file: file.name, 
      url: imageUrl,
      spriteId: sprite.id,
      currentState: $sceneState.objects[sprite.id]
    });
  }

  function removeTexture() {
    if (!selectedObject || selectedObject.type !== 'sprite') return;
    const sprite = selectedObject as SpriteObject;
    
    // Освобождаем URL если это был загруженный файл
    if (sprite.texture && sprite.texture.startsWith('blob:')) {
      URL.revokeObjectURL(sprite.texture);
    }
    
    // Возвращаем заглушку
    updateObject(sprite.id, { 
      texture: 'placeholder',
      textureName: null 
    });
  }

  function removeFilter(filterIndex: number) {
    if (!selectedObject || selectedObject.type !== 'sprite') return;
    const sprite = selectedObject as SpriteObject;
    if (!sprite.filters) return;
    
    const newFilters = sprite.filters.filter((_: any, index: number) => index !== filterIndex);
    updateObject(sprite.id, { filters: newFilters });
  }
</script>

<div class="inspector h-full flex flex-col">
  <!-- Header -->
  <div class="p-3 border-b border-gray-700">
    <h3 class="text-base font-semibold text-white mb-1">Inspector</h3>
    
    {#if selectedObject}
      <div class="flex items-center gap-2 text-xs text-gray-300" id={`inspector-header-${selectedObject.id}`}>
        <Icon name={selectedObject.type === 'sprite' ? 'sprite' : 'space-bg'} size="sm" />
        <span>{selectedObject.name}</span>
      </div>
    {:else}
      <div class="text-xs text-gray-500">No object selected</div>
    {/if}
  </div>

  <!-- Properties -->
  <div class="flex-1 overflow-y-auto p-3 space-y-4">
    {#if selectedObject}
      <!-- Transform Properties -->
      <div class="space-y-3">
        <h4 class="text-xs font-medium text-white border-b border-gray-600 pb-1">Transform</h4>
        
        <div class="grid grid-cols-2 gap-2">
          <div>
          <label class="block text-xs text-gray-400 mb-1" for="transform-x">X</label>
            <Input
              type="number"
              value={selectedObject.x}
              onChange={(value) => updateProperty('x', Number(value) || 0)}
              id="transform-x"
              extraClass="text-xs"
            />
          </div>
          <div>
          <label class="block text-xs text-gray-400 mb-1" for="transform-y">Y</label>
            <Input
              type="number"
              value={selectedObject.y}
              onChange={(value) => updateProperty('y', Number(value) || 0)}
              id="transform-y"
              extraClass="text-xs"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs text-gray-400 mb-1" for="transform-scale">Scale</label>
          <Slider
            value={selectedObject.scale}
            min={0.1}
            max={10}
            step={0.01}
            onChange={(value) => updateProperty('scale', value)}
            id="transform-scale"
            showInput={true}
            inputWidth="w-16"
          />
        </div>

        <div>
          <label class="block text-xs text-gray-400 mb-1" for="transform-rotation">Rotation</label>
          <Slider
            value={selectedObject.rotation}
            min={0}
            max={Math.PI * 2}
            step={0.01}
            onChange={(value) => updateProperty('rotation', value)}
            id="transform-rotation"
            showInput={true}
            inputWidth="w-20"
          />
        </div>

        <div>
          <label class="block text-xs text-gray-400 mb-1" for="transform-alpha">Alpha</label>
          <Slider
            value={selectedObject.alpha}
            min={0}
            max={1}
            step={0.01}
            onChange={(value) => updateProperty('alpha', value)}
            id="transform-alpha"
            showInput={true}
            inputWidth="w-16"
          />
        </div>

        <div class="flex items-center gap-2">
          <Checkbox
            checked={selectedObject.visible}
            onChange={(checked) => updateProperty('visible', checked)}
            id="transform-visible"
          />
          <label class="text-xs text-gray-300" for="transform-visible">Visible</label>
        </div>
      </div>

      <!-- Sprite-specific Properties -->
      {#if selectedObject.type === 'sprite'}
        {@const sprite = selectedObject as SpriteObject}
        <div class="space-y-3">
          <h4 class="text-xs font-medium text-white border-b border-gray-600 pb-1">Sprite</h4>
          
          <div>
          <label class="block text-xs text-gray-400 mb-1" for="sprite-name">Name</label>
            <Input
              value={sprite.name}
              onChange={(value) => updateProperty('name', String(value))}
              id="sprite-name"
              extraClass="text-xs"
            />
          </div>

          <!-- Texture Section -->
          <div>
            <div class="text-xs text-gray-400 mb-1">Texture</div>
            <div class="space-y-1">
              {#if sprite.texture === 'placeholder'}
                <div class="text-xs text-gray-500 bg-gray-800 p-1.5 rounded border border-gray-600">
                  No texture loaded
                </div>
              {:else}
                <div class="text-xs text-green-400 bg-gray-800 p-1.5 rounded border border-green-600">
                  {sprite.textureName || 'Texture loaded'}
                </div>
              {/if}
              
              <div class="flex gap-1">
                <input
                  type="file"
                  accept="image/*"
                  on:change={handleTextureUpload}
                  class="hidden"
                  id="texture-upload-{sprite.id}"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth={true}
                  on:click={() => document.getElementById(`texture-upload-${sprite.id}`)?.click()}
                >
                  <Icon name="upload" size="sm" />
                  Upload
                </Button>
                
                {#if sprite.texture !== 'placeholder'}
                  <Button
                    variant="secondary"
                    size="sm"
                    on:click={removeTexture}
                  >
                    <Icon name="trash" size="sm" />
                  </Button>
                {/if}
              </div>
            </div>
          </div>

          <div>
          <label class="block text-xs text-gray-400 mb-1" for="sprite-tint">Tint</label>
            <ColorPicker
              value={sprite.tint}
              onChange={(value) => updateProperty('tint', value)}
              id="sprite-tint"
            />
          </div>

          <div class="space-y-2">
            <div>
          <label class="block text-xs text-gray-400 mb-1" for={`anchor-x-${sprite.id}`}>Anchor X</label>
              <Slider
                value={sprite.anchor.x}
                min={0}
                max={1}
                step={0.01}
                onChange={(value) => updateProperty('anchor.x', value)}
                id={`anchor-x-${sprite.id}`}
                showInput={true}
                inputWidth="w-16"
              />
            </div>
            <div>
          <label class="block text-xs text-gray-400 mb-1" for={`anchor-y-${sprite.id}`}>Anchor Y</label>
              <Slider
                value={sprite.anchor.y}
                min={0}
                max={1}
                step={0.01}
                onChange={(value) => updateProperty('anchor.y', value)}
                id={`anchor-y-${sprite.id}`}
                showInput={true}
                inputWidth="w-16"
              />
            </div>
          </div>
        </div>

        <!-- Filters -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-medium text-white border-b border-gray-600 pb-1">Filters</h4>
            <Button size="sm" variant="secondary" on:click={addFilter}>
              <Icon name="plus" size="sm" />
              Add
            </Button>
          </div>

          {#each (sprite.filters || []) as filter, index}
            <div class="bg-gray-800 rounded-lg p-2 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs text-gray-300" id={`filter-${index}-${sprite.id}`}>{filter.type}</span>
                <div class="flex items-center gap-1">
                  <Checkbox
                    checked={filter.enabled}
                    onChange={(checked) => updateFilterProperty(index, 'enabled', checked)}
                      id={`filter-enabled-${index}-${sprite.id}`}
                  />
                  <Button size="sm" variant="danger" on:click={() => removeFilter(index)}>
                    <Icon name="trash" size="sm" />
                  </Button>
                </div>
              </div>

              {#if filter.type === 'neonGlowScanline'}
                <div class="space-y-2">
                  <div>
                      <label class="block text-xs text-gray-400 mb-1" for={`filter-glow-${index}-${sprite.id}`}>Glow Color</label>
                    <ColorPicker
                      value={filter.glowColor}
                      onChange={(value) => updateFilterProperty(index, 'glowColor', value)}
                        id={`filter-glow-${index}-${sprite.id}`}
                    />
                  </div>

                  <div>
                      <label class="block text-xs text-gray-400 mb-1" for={`filter-inner-${index}-${sprite.id}`}>Inner Strength</label>
                    <Slider
                      value={filter.innerStrength}
                      min={0}
                      max={3}
                      step={0.01}
                      onChange={(value) => updateFilterProperty(index, 'innerStrength', value)}
                        id={`filter-inner-${index}-${sprite.id}`}
                        showInput={true}
                        inputWidth="w-16"
                    />
                  </div>

                  <div>
                    <label class="block text-xs text-gray-400 mb-1" for={`filter-outer-${index}-${sprite.id}`}>Outer Strength</label>
                    <Slider
                      value={filter.outerStrength}
                      min={0}
                      max={6}
                      step={0.01}
                      onChange={(value) => updateFilterProperty(index, 'outerStrength', value)}
                      id={`filter-outer-${index}-${sprite.id}`}
                        showInput={true}
                        inputWidth="w-16"
                    />
                  </div>

                  <div>
                    <label class="block text-xs text-gray-400 mb-1" for={`filter-radius-${index}-${sprite.id}`}>Radius</label>
                    <Slider
                      value={filter.radius}
                      min={0.5}
                      max={20}
                      step={0.1}
                      onChange={(value) => updateFilterProperty(index, 'radius', value)}
                      id={`filter-radius-${index}-${sprite.id}`}
                        showInput={true}
                        inputWidth="w-16"
                    />
                  </div>

                  <div>
                    <label class="block text-xs text-gray-400 mb-1" for={`filter-samples-${index}-${sprite.id}`}>Samples</label>
                    <Slider
                      value={filter.samples}
                      min={4}
                      max={16}
                      step={1}
                      onChange={(value) => updateFilterProperty(index, 'samples', value)}
                      id={`filter-samples-${index}-${sprite.id}`}
                        showInput={true}
                        inputWidth="w-14"
                    />
                  </div>

                  <div>
                    <label class="block text-xs text-gray-400 mb-1" for={`filter-scan-intensity-${index}-${sprite.id}`}>Scan Intensity</label>
                    <Slider
                      value={filter.scanIntensity}
                      min={0}
                      max={1}
                      step={0.01}
                      onChange={(value) => updateFilterProperty(index, 'scanIntensity', value)}
                      id={`filter-scan-intensity-${index}-${sprite.id}`}
                        showInput={true}
                        inputWidth="w-16"
                    />
                  </div>

                  <div>
                    <label class="block text-xs text-gray-400 mb-1" for={`filter-scan-speed-${index}-${sprite.id}`}>Scan Speed</label>
                    <Slider
                      value={filter.scanSpeed}
                      min={0}
                      max={5}
                      step={0.1}
                      onChange={(value) => updateFilterProperty(index, 'scanSpeed', value)}
                      id={`filter-scan-speed-${index}-${sprite.id}`}
                        showInput={true}
                        inputWidth="w-16"
                    />
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}

      <!-- Space Background Properties -->
      {#if selectedObject.type === 'spaceBackground'}
        {@const spaceBg = selectedObject as SpaceBackgroundObject}
        <div class="space-y-3">
          <h4 class="text-xs font-medium text-white border-b border-gray-600 pb-1">Space Background</h4>
          
          <div>
          <label class="block text-xs text-gray-400 mb-1" for={`space-mood-${spaceBg.id}`}>Mood</label>
            <select
              value={spaceBg.mood}
              on:change={(e) => updateProperty('mood', (e.target as HTMLSelectElement)?.value || 'cosmic')}
              class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white"
            id={`space-mood-${spaceBg.id}`}
            >
              <option value="cosmic">Cosmic</option>
              <option value="neon">Neon</option>
              <option value="aurora">Aurora</option>
              <option value="fire">Fire</option>
              <option value="ice">Ice</option>
              <option value="void">Void</option>
            </select>
          </div>

          <div>
            <label class="block text-xs text-gray-400 mb-1" for={`space-star-count-${spaceBg.id}`}>Star Count</label>
            <Slider
              value={spaceBg.config.starCount}
              min={0}
              max={200}
              step={1}
              onChange={(value) => updateProperty('config.starCount', value)}
              id={`space-star-count-${spaceBg.id}`}
              showInput={true}
              inputWidth="w-16"
            />
          </div>

          <div>
            <label class="block text-xs text-gray-400 mb-1" for={`space-star-brightness-${spaceBg.id}`}>Star Brightness</label>
            <Slider
              value={spaceBg.config.starBrightness}
              min={0}
              max={3}
              step={0.01}
              onChange={(value) => updateProperty('config.starBrightness', value)}
              id={`space-star-brightness-${spaceBg.id}`}
              showInput={true}
              inputWidth="w-16"
            />
          </div>

          <div>
            <label class="block text-xs text-gray-400 mb-1" for={`space-nebula-intensity-${spaceBg.id}`}>Nebula Intensity</label>
            <Slider
              value={spaceBg.config.nebulaIntensity}
              min={0}
              max={2}
              step={0.01}
              onChange={(value) => updateProperty('config.nebulaIntensity', value)}
              id={`space-nebula-intensity-${spaceBg.id}`}
              showInput={true}
              inputWidth="w-16"
            />
          </div>
        </div>
      {/if}
    {:else}
      <div class="text-center text-gray-500 py-6">
        <Icon name="inspect" size="lg" class="mx-auto mb-2" />
        <p class="text-xs">Select an object to inspect its properties</p>
      </div>
    {/if}
  </div>
</div>
