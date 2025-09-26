<script lang="ts">
  import { spectorDebugger } from '@/utils/spector';
  import { onMount, onDestroy } from 'svelte';
  import { panelPositioningService } from '@engine/ui';
  import { ServiceRegistry, ServiceKeys } from '@engine/registry/ServiceRegistry';
  import Icon from '@ui/base/Icon.svelte';
  
  let buttonElement: HTMLElement;
  let isVisible = false;
  let isRecording = false;
  let recordingTime = 0;
  let recordingInterval: NodeJS.Timeout | null = null;
  let fps = 0;
  let fpsUpdateInterval: NodeJS.Timeout | null = null;
  
  // Подписываемся на изменения состояния записи
  $: isRecording = spectorDebugger.isRecording();

  let startDelay: NodeJS.Timeout | null = null;
  
  // Таймер записи
  $: if (isRecording && !recordingInterval) {
    recordingTime = 0;
    recordingInterval = setInterval(() => {
      recordingTime++;
    }, 1000);
  } else if (!isRecording && recordingInterval) {
    clearInterval(recordingInterval);
    recordingInterval = null;
  }
  
  onMount(() => {
    if (buttonElement) {
      // Регистрируем кнопку в сервисе позиционирования
      panelPositioningService.registerPanel({
        id: 'spector-debug-button',
        anchor: 'TR',
        offsetX: 19, // 4 * 4px = 16px (top-4)
        offsetY: 64, // 4 * 4px = 16px (right-4)
        element: buttonElement
      });
    }
    
    // Запускаем FPS мониторинг
    startFPSMonitoring();
  });
  
  onDestroy(() => {
    panelPositioningService.unregisterPanel('spector-debug-button');
    stopFPSMonitoring();
  });
  
  function toggleRecording() {
    spectorDebugger.toggleRecording();
  }
  
  function captureFrame() {
    spectorDebugger.captureFrame();
  }
  
  function togglePanel() {
    isVisible = !isVisible;
  }
  
  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  function startFPSMonitoring() {
    if (fpsUpdateInterval) {
      return;
    }

    const ensurePixiApp = () => {
      if (!ServiceRegistry.has(ServiceKeys.PixiApp)) {
        return;
      }

      fpsUpdateInterval = setInterval(() => {
        const pixiApp = ServiceRegistry.has(ServiceKeys.PixiApp)
          ? ServiceRegistry.get(ServiceKeys.PixiApp) as any
          : null;

        if (pixiApp?.ticker?.FPS !== undefined) {
          fps = Math.round(pixiApp.ticker.FPS);
          return;
        }

        fps = 0;
      }, 500);
    };

    if (!ServiceRegistry.has(ServiceKeys.PixiApp)) {
      startDelay = setTimeout(() => {
        startDelay = null;
        ensurePixiApp();
      }, 250);
      return;
    }

    ensurePixiApp();
  }
  
  function stopFPSMonitoring() {
    if (startDelay) {
      clearTimeout(startDelay);
      startDelay = null;
    }
    if (fpsUpdateInterval) {
      clearInterval(fpsUpdateInterval);
      fpsUpdateInterval = null;
    }
  }
  
  function getFPSColor(): string {
    if (fps >= 55) return 'text-green-400';
    if (fps >= 30) return 'text-yellow-400';
    return 'text-red-400';
  }
</script>

<!-- Кнопка для открытия панели -->
{#if import.meta.env.DEV}
  <button
    bind:this={buttonElement}
    class="spector-toggle-btn"
    class:recording={isRecording}
    on:click={togglePanel}
    aria-label="Toggle Spector Debug Panel"
  >
    <Icon 
      name="debug" 
      size="lg" 
      color="neon-purple"
      class="spector-icon"
    />
    <!-- FPS индикатор -->
    <span class="fps-indicator {getFPSColor()}">
      {fps}
    </span>
    {#if isRecording}
      <span class="recording-indicator"></span>
    {/if}
  </button>
{/if}

<!-- Панель отладки -->
{#if isVisible && import.meta.env.DEV}
  <div class="spector-panel">
    <div class="panel-header">
      <h3>WebGL Debug</h3>
      <button class="close-btn" on:click={togglePanel}>×</button>
    </div>
    
    <div class="panel-content">
      <!-- Статус записи и FPS -->
      <div class="status-section">
        <div class="status-item">
          <span class="status-label">Recording:</span>
          <span class="status-value" class:active={isRecording}>
            {isRecording ? `Active (${formatTime(recordingTime)})` : 'Stopped'}
          </span>
        </div>
        <div class="status-item">
          <span class="status-label">FPS:</span>
          <span class="status-value {getFPSColor()}">
            {fps}
          </span>
        </div>
      </div>
      
      <!-- Кнопки управления -->
      <div class="controls-section">
        <button 
          class="control-btn primary"
          class:recording={isRecording}
          on:click={toggleRecording}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
        
        <button 
          class="control-btn secondary"
          on:click={captureFrame}
          disabled={isRecording}
        >
          Capture Frame
        </button>
      </div>
      
      <!-- Горячие клавиши -->
      <div class="hotkeys-section">
        <h4>Hotkeys</h4>
        <div class="hotkey-item">
          <kbd>Ctrl+Shift+R</kbd>
          <span>Toggle Recording</span>
        </div>
        <div class="hotkey-item">
          <kbd>Ctrl+Shift+C</kbd>
          <span>Capture Frame</span>
        </div>
      </div>
      
      <!-- Информация -->
      <div class="info-section">
        <p class="info-text">
          Spector.js позволяет записывать и анализировать WebGL вызовы для отладки производительности.
        </p>
      </div>
    </div>
  </div>
{/if}

<style lang="postcss">
  @reference "@/styles/theme.css";
  
  .spector-toggle-btn {
    @apply z-50;
    @apply w-12 h-12 rounded-full;
    @apply bg-black/80 backdrop-blur-sm;
    @apply border border-neon-purple/30;
    @apply flex items-center justify-center;
    @apply cursor-pointer transition-all duration-200;
    @apply hover:bg-neon-purple/20 hover:border-neon-purple/60;
    @apply active:scale-95;
    @apply pointer-events-auto;
    
    &.recording {
      @apply bg-red-500/80 border-red-400;
      @apply animate-pulse;
    }
    
    :global(.spector-icon) {
      @apply transition-transform duration-200;
    }
    
    &:hover :global(.spector-icon) {
      @apply scale-110;
    }
  }
  
  .fps-indicator {
    @apply absolute -bottom-1 -right-1;
    @apply px-1 py-0.5 rounded text-xs font-mono font-bold;
    @apply bg-black/80 backdrop-blur-sm;
    @apply min-w-6 text-center;
    @apply transition-colors duration-300;
  }
  
  .recording-indicator {
    @apply absolute -top-1 -right-1;
    @apply w-4 h-4 rounded-full;
    @apply bg-red-500;
    @apply animate-ping;
  }
  
  .spector-panel {
    @apply fixed top-4 right-4 z-40;
    @apply w-80 max-w-[calc(100vw-2rem)];
    @apply bg-neon-black/95 backdrop-blur-md;
    @apply border-2 border-neon-cyan;
    @apply rounded-xl;
    @apply shadow-2xl shadow-neon-cyan/20;
    animation: slide-in-from-right 0.3s ease-out;
  }
  
  .panel-header {
    @apply flex items-center justify-between;
    @apply p-4 border-b border-neon-cyan/30;
    
    h3 {
      @apply text-neon-white font-orbitron text-lg;
      @apply m-0;
    }
    
    .close-btn {
      @apply w-8 h-8 rounded-full;
      @apply bg-neon-purple/20 hover:bg-neon-purple/40;
      @apply text-neon-white text-xl;
      @apply flex items-center justify-center;
      @apply transition-colors duration-200;
    }
  }
  
  .panel-content {
    @apply p-4 space-y-4;
    @apply max-h-96 overflow-y-auto;
  }
  
  .status-section {
    @apply space-y-2;
  }
  
  .status-item {
    @apply flex justify-between items-center;
    @apply p-2 rounded-lg;
    @apply bg-neon-dark/50;
  }
  
  .status-label {
    @apply text-neon-cyan font-medium;
  }
  
  .status-value {
    @apply text-neon-white;
    
    &.active {
      @apply text-green-400 font-semibold;
    }
  }
  
  .controls-section {
    @apply space-y-3;
  }
  
  .control-btn {
    @apply w-full px-4 py-3 rounded-lg;
    @apply font-orbitron font-medium;
    @apply transition-all duration-200;
    @apply disabled:opacity-50 disabled:cursor-not-allowed;
    
    &.primary {
      @apply bg-neon-purple/20 border-neon-purple;
      @apply text-neon-white;
      @apply hover:bg-neon-purple/40;
      @apply active:scale-95;
      
      &.recording {
        @apply bg-red-500/20 border-red-400;
        @apply text-red-300;
        @apply hover:bg-red-500/40;
      }
    }
    
    &.secondary {
      @apply bg-neon-cyan/20 border-neon-cyan;
      @apply text-neon-white;
      @apply hover:bg-neon-cyan/40;
      @apply active:scale-95;
    }
  }
  
  .hotkeys-section {
    @apply space-y-2;
    
    h4 {
      @apply text-neon-cyan font-orbitron;
      @apply m-0 mb-2;
    }
  }
  
  .hotkey-item {
    @apply flex items-center gap-3;
    @apply p-2 rounded-lg;
    @apply bg-neon-dark/30;
    
    kbd {
      @apply px-2 py-1 rounded;
      @apply bg-neon-purple/30 border border-neon-purple;
      @apply text-neon-cyan text-sm font-mono;
      @apply min-w-20 text-center;
    }
    
    span {
      @apply text-neon-white text-sm;
    }
  }
  
  .info-section {
    @apply p-3 rounded-lg;
    @apply bg-neon-dark/20;
    @apply border border-neon-cyan/20;
  }
  
  .info-text {
    @apply text-neon-white/80 text-sm;
    @apply m-0 leading-relaxed;
  }
  
  /* Мобильные стили */
  @media (max-width: 768px) {
    .spector-panel {
      @apply w-72;
    }
    
    .spector-toggle-btn {
      @apply top-2 right-2;
      @apply w-10 h-10;
    }
    
    .panel-content {
      @apply p-3 space-y-3;
    }
    
    .control-btn {
      @apply py-2 text-sm;
    }
    
    .hotkey-item {
      @apply flex-col items-start gap-1;
      
      kbd {
        @apply text-xs;
      }
      
      span {
        @apply text-xs;
      }
    }
  }
  
  /* Анимации */
  @keyframes slide-in-from-right {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
</style>
