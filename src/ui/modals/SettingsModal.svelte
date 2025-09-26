<script lang="ts">
  import { logger } from '@/engine/logging';
  import Modal from '../base/Modal.svelte';
  import { animations } from '@utils/animations';
  import { eventBus } from '@/engine/events';
  import { gameEventBus } from '@/game/events';
  import { profileActions, profileSelectors, profileStore } from '@/stores/game/profile';
  import { onMount, onDestroy } from 'svelte';
  
  export let isOpen = false;
  
  // Audio settings reactive variables - reactive to profile changes
  let audioSettings = profileSelectors.audio();
  
  // Subscribe to profile changes for reactivity
  const unsubscribe = profileStore.subscribe(profile => {
    logger.debug('🎨 UI updating with new audio settings:', { profile })
    audioSettings = profile.settings.audio;
  });
  
  let unsubscribeEvents: (() => void)[] = [];
  
  onMount(() => {
    // Подписываемся на события профиля через системный eventBus
    unsubscribeEvents.push(
      eventBus.on('profile-reset', () => {
        // Обновляем UI после сброса профиля
        audioSettings = profileSelectors.audio();
      })
    );
    
    // Подписываемся на игровые события
    unsubscribeEvents.push(
      gameEventBus.on('settings-open', () => {
        isOpen = true;
      })
    );
  });
  
  onDestroy(() => {
    // Отписываемся от всех событий
    unsubscribeEvents.forEach(fn => fn());
    unsubscribe();
  });
  
  function handleClose() {
    isOpen = false;
    gameEventBus.emit('settings-close');
  }
  
  function handleResetSettings(event: MouseEvent) {
    if (confirm('Are you sure you want to reset your settings? This action cannot be undone.')) {
      logger.info('🔄 Settings reset requested by user');
      profileActions.resetProfile(); // Уже эмитит 'profile-reset' событие
    }
    animateButton(event);
  }
  
  function animateButton(event: MouseEvent) {
    const button = event.currentTarget as HTMLElement;
    if (button) {
      animations.buttonPress(button);
    }
  }
  
  // Generic toggle handler factory - DRY principle
  function createAudioToggleHandler(
    settingKey: 'musicEnabled' | 'sfxEnabled'
  ) {
    return (event: MouseEvent) => {
      // Получаем актуальное значение из профиля
      const currentSettings = profileSelectors.audio();
      const currentValue = currentSettings[settingKey];
      const newValue = !currentValue;
      
      logger.debug(`🔊 Toggling ${settingKey}: ${currentValue} -> ${newValue}`)
      
      // Обновляем через profileActions для автоматического сохранения
      profileActions.updateAudioSettings({ [settingKey]: newValue });
      animateButton(event);
    };
  }
  
  // Specific handlers using factory
  const handleMusicToggle = createAudioToggleHandler('musicEnabled');
  const handleSfxToggle = createAudioToggleHandler('sfxEnabled');
  
  
</script>

<Modal
  {isOpen}
  title="Settings"
  size="sm"
  on:close={handleClose}
>
  <div class="settings-container">
    <!-- Audio Settings -->
    <div class="settings-section">
      <h3 class="section-title">Audio</h3>
      
      <!-- Music Toggle -->
      <div class="toggle-item">
        <span class="toggle-label">Music</span>
        <button 
          class="toggle-button cursor-pointer {audioSettings.musicEnabled ? 'active' : ''}"
          onclick={handleMusicToggle}
          aria-label="Toggle music"
        >
          <div class="toggle-switch"></div>
        </button>
      </div>
      
      <!-- SFX Toggle -->
      <div class="toggle-item">
        <span class="toggle-label">Sound Effects</span>
        <button 
          class="toggle-button cursor-pointer {audioSettings.sfxEnabled ? 'active' : ''}"
          onclick={handleSfxToggle}
          aria-label="Toggle sound effects"
        >
          <div class="toggle-switch"></div>
        </button>
      </div>
    </div>
    
    <!-- Settings Actions -->
    <div class="settings-section">
      <h3 class="section-title">Actions</h3>
      
      <button 
        class="reset-settings-button cursor-pointer"
        onclick={handleResetSettings}
      >
        <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
          <path d="M3 3v5h5"></path>
        </svg>
        Reset Settings
      </button>
    </div>
  </div>
</Modal>

<style lang="postcss">
  @reference "@/styles/theme.css";
  
  .settings-container {
    @apply space-y-6;
  }
  
  .settings-section {
    @apply space-y-4;
  }
  
  .section-title {
    @apply text-base font-semibold text-neon-green;
    @apply m-0 mb-3;
  }
  
  /* Toggle Items */
  .toggle-item {
    @apply flex items-center justify-between;
    @apply py-3 px-4;
    @apply bg-gray-800/30 border border-gray-700/50;
    @apply rounded-lg;
    @apply transition-all duration-200;
  }
  
  .toggle-item:hover {
    @apply bg-gray-700/40 border-gray-600/60;
  }
  
  .toggle-label {
    @apply text-sm font-medium text-gray-200;
  }
  
  /* Toggle Button */
  .toggle-button {
    @apply relative w-12 h-6;
    @apply bg-gray-600 border border-gray-500;
    @apply rounded-full;
    @apply transition-all duration-300;
    @apply focus:outline-none focus:ring-2 focus:ring-neon-green/50;
    @apply active:scale-95;
  }
  
  .toggle-button.active {
    @apply bg-neon-green border-neon-green;
    @apply shadow-lg shadow-neon-green/30;
  }
  
  .toggle-switch {
    @apply absolute top-0.5 left-0.5 w-5 h-5;
    @apply bg-white rounded-full;
    @apply transition-transform duration-300;
    @apply shadow-sm;
  }
  
  .toggle-button.active .toggle-switch {
    @apply transform translate-x-6;
  }
  
  /* Settings Button */
  .reset-settings-button {
    @apply w-full;
    @apply bg-red-600/20 border border-red-500/50;
    @apply text-red-400 hover:bg-red-600/30 hover:border-red-500/70;
    @apply px-4 py-3 rounded-lg;
    @apply flex items-center justify-center gap-3;
    @apply font-medium transition-all duration-200;
    @apply active:scale-95;
  }
  
  .button-icon {
    @apply w-4 h-4;
  }
  
  /* Mobile optimizations */
  @media (max-width: 640px) {
    .settings-container {
      @apply space-y-4;
    }
    
    .toggle-item {
      @apply py-4 px-3;
    }
    
    .toggle-button {
      @apply w-14 h-7;
    }
    
    .toggle-switch {
      @apply w-6 h-6;
    }
    
    .toggle-button.active .toggle-switch {
      @apply transform translate-x-7;
    }
  }
</style>
