<script lang="ts">
  import { onMount } from 'svelte';
  import Modal from '../base/Modal.svelte';
  import type { LogRecord } from '@/engine/logging';
  import { ringBuffer } from '@/engine/logging';
  import { eventBus } from '@/engine/events/EventBus';

  // Svelte 5 runes - используем $state вместо export let
  let visible = $state(false);
  type Err = { name: string; message: string; stack?: string };
  let error = $state<Err | null>(null);
  let breadcrumbs = $state<LogRecord[]>([]);

  // Экспортируемые методы (станут доступными у результата mount(...))
  export function setError(e: Err) { 
    error = e; 
  }
  export function show() { 
    visible = true; 
  }
  export function hide() { 
    visible = false; 
  }

  // Реактивность через $effect вместо $:
  $effect(() => {
    if (visible && error) {
      breadcrumbs = ringBuffer.getRecent(50);
    }
  });

  function reload() {
    location.reload();
  }

  async function copy() {
    if (!error) return;
    
    // Если в stack уже есть полная ошибка, используем только stack
    // Иначе собираем из name + message + stack
    let text: string;
    
    if (error.stack && error.stack.includes(error.message)) {
      // Убираем дублирование "Error:" и повторяющийся message из stack trace
      let cleanStack = error.stack.replace(/^Error:\s*/, '');
      
      // Если message повторяется в stack, убираем его
      if (cleanStack.startsWith(error.message)) {
        cleanStack = cleanStack.substring(error.message.length).trim();
      }
      
      text = `${error.message}\n${cleanStack}`;
    } else {
      text = `${error.name}: ${error.message}\n${error.stack || ''}`;
    }
    
    // Пробуем современный Clipboard API (требует HTTPS)
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch (err) {
        console.warn('Clipboard API failed, falling back to legacy method:', err);
      }
    }
    
    // Fallback для HTTP соединений (localhost работает, но IP адреса - нет)
    try {
      // Создаем временный textarea для копирования
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-999999px';
      textarea.style.top = '-999999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      
      if (!successful) {
        throw new Error('execCommand copy failed');
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // В крайнем случае показываем текст в alert
      alert('Не удалось скопировать в буфер обмена. Текст ошибки:\n\n' + text);
    }
  }

  function dismiss() {
    hide();
    error = null;
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && visible) {
      dismiss();
    }
  }

  onMount(() => {
    eventBus.on('keydown', onKeydown);
    return () => eventBus.off('keydown', onKeydown);
  });
</script>

<Modal
  isOpen={visible}
  title="💥 Ошибка"
  size="lg"
  on:close={dismiss}
>
  {#if error}
    <div class="error-content">
      <div class="error-header">
        <p class="error-message">{error.message}</p>
      </div>
      
      {#if error.stack}
        <div class="error-stack">
          <h3 class="stack-title">Stack Trace</h3>
          <pre class="stack-content">{error.stack.replace(/^Error:\s*/, '').replace(new RegExp(`^${error.message.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`), '')}</pre>
        </div>
      {/if}
      
      <div class="error-actions">
        <button 
          onclick={reload} 
          class="action-button reload-button"
        >
          <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
            <path d="M3 3v5h5"></path>
          </svg>
          Reload
        </button>
        <button 
          onclick={copy} 
          class="action-button copy-button"
        >
          <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Copy Error
        </button>
      </div>
      
      <details class="breadcrumbs-section">
        <summary class="breadcrumbs-summary">
          📋 Breadcrumbs ({breadcrumbs.length})
        </summary>
        <div class="breadcrumbs-content">
          {#each breadcrumbs as log}
            <div class="log-entry {log.level === 'error' || log.level === 'fatal' ? 'log-error' : log.level === 'warn' ? 'log-warn' : 'log-info'}">
              <div class="log-header">
                <span class="log-timestamp">[{new Date(log.ts).toISOString()}]</span>
                <span class="log-level {log.level}">{log.level.toUpperCase()}</span>
                <span class="log-source">[{log.source}]</span>
              </div>
              <div class="log-message">{log.msg}</div>
              {#if log.fields && Object.keys(log.fields).length > 0}
                <div class="log-fields">
                  {JSON.stringify(log.fields, null, 2)}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </details>
    </div>
  {/if}
</Modal>

<style lang="postcss">
  @reference "@/styles/theme.css";
  
  .error-content {
    @apply space-y-6;
  }
  
  .error-header {
    @apply space-y-3;
  }
  
  .error-title {
    @apply text-xl font-bold m-0;
  }
  
  .error-message {
    @apply text-base text-gray-300 m-0;
  }
  
  .error-stack {
    @apply space-y-3;
  }
  
  .stack-title {
    @apply text-sm font-semibold text-neon-green m-0;
  }
  
  .stack-content {
    @apply bg-gray-900/50 p-4 rounded-lg;
    @apply text-xs font-mono text-gray-300;
    @apply whitespace-pre-wrap overflow-auto;
    @apply max-h-48 border border-gray-700/50;
  }
  
  .error-actions {
    @apply flex gap-3 flex-wrap;
  }
  
  .action-button {
    @apply flex items-center gap-2 px-4 py-2 rounded-lg;
    @apply font-medium transition-all duration-200;
    @apply active:scale-95;
  }
  
  .reload-button {
    @apply bg-red-600/20 border border-red-500/50;
    @apply text-red-400 hover:bg-red-600/30 hover:border-red-500/70;
  }
  
  .copy-button {
    @apply bg-blue-600/20 border border-blue-500/50;
    @apply text-blue-400 hover:bg-blue-600/30 hover:border-blue-500/70;
  }
  
  .button-icon {
    @apply w-4 h-4;
  }
  
  .breadcrumbs-section {
    @apply space-y-3;
  }
  
  .breadcrumbs-summary {
    @apply cursor-pointer text-base font-semibold;
    @apply text-neon-green hover:text-neon-green/80;
    @apply transition-colors duration-200;
  }
  
  .breadcrumbs-content {
    @apply bg-gray-900/30 p-4 rounded-lg;
    @apply max-h-96 overflow-auto;
    @apply space-y-2 border border-gray-700/50;
  }
  
  .log-entry {
    @apply p-3 rounded text-xs font-mono;
    @apply border-l-4 transition-colors duration-200;
  }
  
  .log-error {
    @apply bg-red-900/20 border-red-600;
  }
  
  .log-warn {
    @apply bg-yellow-900/20 border-yellow-600;
  }
  
  .log-info {
    @apply bg-gray-900/20 border-gray-600;
  }
  
  .log-header {
    @apply flex items-center gap-2 mb-1;
  }
  
  .log-timestamp {
    @apply text-gray-400;
  }
  
  .log-level {
    @apply px-1.5 py-0.5 rounded text-xs font-bold;
  }
  
  .log-level.error,
  .log-level.fatal {
    @apply bg-red-600 text-white;
  }
  
  .log-level.warn {
    @apply bg-yellow-600 text-white;
  }
  
  .log-level.info,
  .log-level.debug,
  .log-level.trace {
    @apply bg-gray-600 text-white;
  }
  
  .log-source {
    @apply text-neon-cyan;
  }
  
  .log-message {
    @apply text-gray-200 mb-1;
  }
  
  .log-fields {
    @apply text-gray-400 ml-4 mt-1;
    @apply whitespace-pre-wrap;
  }
  
  /* Mobile optimizations */
  @media (max-width: 640px) {
    .error-actions {
      @apply flex-col;
    }
    
    .action-button {
      @apply w-full justify-center;
    }
    
    .breadcrumbs-content {
      @apply max-h-64;
    }
  }
</style>
