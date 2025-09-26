import { Scene } from '../scene/Scene';
import { logger } from '../logging';

/**
 * Базовый класс для всех игровых систем
 * Предоставляет общий интерфейс и жизненный цикл
 */
export abstract class System {
  protected _scene: Scene;
  protected isStarted: boolean = false;
  protected isDestroyed: boolean = false;

  constructor(scene: Scene) {
    this._scene = scene;
    
    logger.debug(`🔧 ${this.constructor.name} создана`, {
      scene: scene.constructor.name
    });
  }

  /**
   * Запустить систему
   * Переопределяется в наследниках для инициализации
   */
  start(): void {
    if (this.isStarted) {
      logger.warn(`⚠️ ${this.constructor.name} уже запущена`);
      return;
    }

    this.isStarted = true;
    this.onStart();
    
    logger.info(`▶️ ${this.constructor.name} запущена`);
  }

  /**
   * Остановить систему
   * Переопределяется в наследниках для очистки ресурсов
   */
  stop(): void {
    if (!this.isStarted) {
      logger.warn(`⚠️ ${this.constructor.name} не запущена`);
      return;
    }

    this.isStarted = false;
    this.onStop();
    
    logger.info(`⏹️ ${this.constructor.name} остановлена`);
  }

  /**
   * Обновить систему
   * Вызывается каждый кадр из сцены
   */
  update(deltaTime: number): void {
    if (!this.isStarted || this.isDestroyed) {
      return;
    }

    this.onUpdate(deltaTime);
  }

  /**
   * Уничтожить систему
   * Окончательная очистка всех ресурсов
   */
  destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    this.stop();
    this.onDestroy();
    this.isDestroyed = true;
    
    logger.info(`💥 ${this.constructor.name} уничтожена`);
  }

  /**
   * Проверить, запущена ли система
   */
  get started(): boolean {
    return this.isStarted;
  }

  /**
   * Проверить, уничтожена ли система
   */
  get destroyed(): boolean {
    return this.isDestroyed;
  }

  /**
   * Получить сцену, к которой привязана система
   */
  get scene(): Scene {
    return this._scene;
  }

  // ===== Виртуальные методы для переопределения =====

  /**
   * Вызывается при запуске системы
   * Переопределяется в наследниках
   */
  protected onStart(): void {
    // По умолчанию ничего не делаем
  }

  /**
   * Вызывается при остановке системы
   * Переопределяется в наследниках
   */
  protected onStop(): void {
    // По умолчанию ничего не делаем
  }

  /**
   * Вызывается каждый кадр для обновления системы
   * Переопределяется в наследниках
   */
  protected onUpdate(_deltaTime: number): void {
    // По умолчанию ничего не делаем
  }

  /**
   * Вызывается при уничтожении системы
   * Переопределяется в наследниках для финальной очистки
   */
  protected onDestroy(): void {
    // По умолчанию ничего не делаем
  }
}
