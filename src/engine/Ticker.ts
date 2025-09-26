import { logger } from '@/engine/logging';
/**
 * Управление игровым циклом на основе requestAnimationFrame
 * Предоставляет delta time для плавных анимаций
 */
export class Ticker {
  private animationId: number | null = null;
  private lastTime = 0;
  private isRunning = false;
  private updateCallbacks: ((deltaTime: number) => void)[] = [];

  /**
   * Запустить игровой цикл
   */
  public start(): void {
    if (this.isRunning) {
      logger.warn('Ticker уже запущен!', { source: 'game' });
      return;
    }

    this.isRunning = true;
    this.lastTime = performance.now();
    this.tick();
  }

  /**
   * Остановить игровой цикл
   */
  public stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Добавить callback для обновления
   */
  public addUpdateCallback(callback: (deltaTime: number) => void): void {
    this.updateCallbacks.push(callback);
  }

  /**
   * Удалить callback для обновления
   */
  public removeUpdateCallback(callback: (deltaTime: number) => void): void {
    const index = this.updateCallbacks.indexOf(callback);
    if (index !== -1) {
      this.updateCallbacks.splice(index, 1);
    }
  }

  /**
   * Основной цикл обновления
   */
  private tick = (): void => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000; // Конвертируем в секунды
    this.lastTime = currentTime;

    // Ограничиваем delta time для предотвращения больших скачков
    const clampedDeltaTime = Math.min(deltaTime, 1 / 30); // Максимум 30 FPS

    // Вызываем все callback'и
    for (const callback of this.updateCallbacks) {
      try {
        callback(clampedDeltaTime);
      } catch (error) {
        logger.error('Ошибка в игровом цикле:', error as Error, { source: 'game' });
      }
    }

    // Планируем следующий кадр
    this.animationId = requestAnimationFrame(this.tick);
  };

  /**
   * Проверить, запущен ли ticker
   */
  public get running(): boolean {
    return this.isRunning;
  }

  /**
   * Получить FPS (приблизительно)
   */
  public getFPS(): number {
    if (!this.isRunning) return 0;
    
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000;
    return deltaTime > 0 ? 1 / deltaTime : 0;
  }
}
