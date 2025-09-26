// @ts-ignore - spectorjs не имеет типов
import { Spector } from 'spectorjs';
import { eventBus } from '@/engine/events/EventBus';

/**
 * Spector.js WebGL debugger utility
 * Позволяет записывать и анализировать WebGL вызовы
 */
export class SpectorDebugger {
  private spector: Spector | null = null;
  private isEnabled = false;

  constructor() {
    // Инициализируем только в dev режиме
    if (import.meta.env.DEV) {
      this.initialize();
    }
  }

  private initialize(): void {
    try {
      this.spector = new Spector();
      // Не показываем дефолтную UI - используем свою мобильную панель
      // this.spector.displayUI();
      console.log('🎮 Spector.js initialized for WebGL debugging (custom UI)');
    } catch (error) {
      console.warn('Failed to initialize Spector.js:', error);
    }
  }

  /**
   * Включает/выключает запись WebGL команд
   */
  public toggleRecording(): void {
    if (!this.spector) {
      console.warn('Spector.js not initialized');
      return;
    }

    if (this.isEnabled) {
      this.spector.stopCapture();
      this.isEnabled = false;
      console.log('🔴 Spector recording stopped');
    } else {
      this.spector.startCapture();
      this.isEnabled = true;
      console.log('🟢 Spector recording started');
    }
  }

  /**
   * Записывает один кадр WebGL команд
   */
  public captureFrame(): void {
    if (!this.spector) {
      console.warn('Spector.js not initialized');
      return;
    }

    this.spector.captureCanvas(document.getElementById('pixi-canvas') as HTMLCanvasElement);
    console.log('📸 Spector frame captured');
  }

  /**
   * Проверяет, включена ли запись
   */
  public isRecording(): boolean {
    return this.isEnabled;
  }

  /**
   * Добавляет горячие клавиши для управления
   */
  public addHotkeys(): void {
    if (!this.spector) return;

    eventBus.on('keydown', (event) => {
      // Ctrl+Shift+R - toggle recording
      if (event.ctrlKey && event.shiftKey && event.key === 'R') {
        event.preventDefault();
        this.toggleRecording();
      }
      
      // Ctrl+Shift+C - capture frame
      if (event.ctrlKey && event.shiftKey && event.key === 'C') {
        event.preventDefault();
        this.captureFrame();
      }
    });

    console.log('⌨️ Spector hotkeys added:');
    console.log('  Ctrl+Shift+R - Toggle recording');
    console.log('  Ctrl+Shift+C - Capture frame');
  }
}

// Создаем глобальный экземпляр
export const spectorDebugger = new SpectorDebugger();
