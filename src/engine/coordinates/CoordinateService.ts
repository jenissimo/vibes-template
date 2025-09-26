import { Vector2, Rect } from '@/shared/types';
import { LayoutResult } from '@/engine/render';
import { logger } from '@/engine/logging';

/**
 * CoordinateService - централизованный сервис для управления координатами
 * Решает проблему coordinate system hell - все конвертации координат в одном месте
 */
export class CoordinateService {
  private static instance: CoordinateService | null = null;
  private layout: LayoutResult | null = null;

  public static getInstance(): CoordinateService {
    if (!CoordinateService.instance) {
      CoordinateService.instance = new CoordinateService();
    }
    return CoordinateService.instance;
  }

  /**
   * Установить layout для конвертации координат
   */
  public setLayout(layout: LayoutResult): void {
    this.layout = layout;
    logger.debug('CoordinateService layout updated', { 
      game: { x: layout.game.x, y: layout.game.y, w: layout.game.w, h: layout.game.h },
      scale: layout.scaleGame,
      source: 'coordinate'
    });
  }

  /**
   * Конвертировать экранные координаты в игровые
   */
  public screenToGame(screenX: number, screenY: number): Vector2 {
    if (!this.layout) {
      logger.warn('No layout available, returning screen coordinates', { 
        screenX, 
        screenY, 
        source: 'coordinate' 
      });
      return { x: screenX, y: screenY };
    }

    const gameX = (screenX - this.layout.game.x) / this.layout.scaleGame;
    const gameY = (screenY - this.layout.game.y) / this.layout.scaleGame;
    
    return { x: gameX, y: gameY };
  }

  /**
   * Конвертировать игровые координаты в экранные
   */
  public gameToScreen(gameX: number, gameY: number): Vector2 {
    if (!this.layout) {
      logger.warn('No layout available, returning game coordinates', { 
        gameX, 
        gameY, 
        source: 'coordinate' 
      });
      return { x: gameX, y: gameY };
    }

    const screenX = gameX * this.layout.scaleGame + this.layout.game.x;
    const screenY = gameY * this.layout.scaleGame + this.layout.game.y;
    
    return { x: screenX, y: screenY };
  }

  /**
   * Получить центр игрового мира
   */
  public getGameCenter(): Vector2 {
    if (!this.layout) {
      logger.warn('No layout available, using fallback center', { source: 'coordinate' });
      return { x: 400, y: 300 }; // fallback
    }

    return {
      x: this.layout.game.w / 2 / this.layout.scaleGame,
      y: this.layout.game.h / 2 / this.layout.scaleGame
    };
  }

  /**
   * Получить границы игрового мира
   */
  public getGameBounds(): Rect {
    if (!this.layout) {
      logger.warn('No layout available, using fallback bounds', { source: 'coordinate' });
      return { x: 0, y: 0, w: 800, h: 600 };
    }

    return {
      x: 0,
      y: 0,
      w: this.layout.game.w / this.layout.scaleGame,
      h: this.layout.game.h / this.layout.scaleGame
    };
  }

  /**
   * Получить масштаб игрового мира
   */
  public getGameScale(): number {
    if (!this.layout) {
      logger.warn('No layout available, using fallback scale', { source: 'coordinate' });
      return 1.0;
    }

    return this.layout.scaleGame;
  }

  /**
   * Проверить, находится ли точка в игровых границах
   */
  public isPointInGameBounds(gameX: number, gameY: number): boolean {
    const bounds = this.getGameBounds();
    return gameX >= bounds.x && gameX <= bounds.w && 
           gameY >= bounds.y && gameY <= bounds.h;
  }

  /**
   * Получить случайную позицию в игровых границах
   */
  public getRandomGamePosition(): Vector2 {
    const bounds = this.getGameBounds();
    return {
      x: Math.random() * bounds.w,
      y: Math.random() * bounds.h
    };
  }

  /**
   * Получить случайную позицию в центре игрового мира с отклонением
   */
  public getRandomCenterPosition(offsetRange: number = 100): Vector2 {
    const center = this.getGameCenter();
    return {
      x: center.x + (Math.random() - 0.5) * offsetRange,
      y: center.y + (Math.random() - 0.5) * offsetRange
    };
  }

  /**
   * Получить ширину игрового мира
   */
  public getGameWidth(): number {
    if (!this.layout) {
      logger.warn('No layout available, using fallback width', { source: 'coordinate' });
      return 800;
    }
    return this.layout.game.w / this.layout.scaleGame;
  }

  /**
   * Получить высоту игрового мира
   */
  public getGameHeight(): number {
    if (!this.layout) {
      logger.warn('No layout available, using fallback height', { source: 'coordinate' });
      return 600;
    }
    return this.layout.game.h / this.layout.scaleGame;
  }

  /**
   * Получить размеры игрового мира
   */
  public getGameDimensions(): { width: number; height: number } {
    return {
      width: this.getGameWidth(),
      height: this.getGameHeight()
    };
  }

  /**
   * Получить случайную позицию по краям игрового мира
   */
  public getRandomEdgePosition(): Vector2 {
    const bounds = this.getGameBounds();
    const edge = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
    
    switch (edge) {
      case 0: // top
        return { x: Math.random() * bounds.w, y: bounds.y };
      case 1: // right
        return { x: bounds.w, y: Math.random() * bounds.h };
      case 2: // bottom
        return { x: Math.random() * bounds.w, y: bounds.h };
      case 3: // left
        return { x: bounds.x, y: Math.random() * bounds.h };
      default:
        return { x: bounds.w / 2, y: bounds.h / 2 };
    }
  }

  /**
   * Получить безопасную зону (игровые границы с отступами)
   */
  public getSafeZone(margin: number = 50): Rect {
    const bounds = this.getGameBounds();
    return {
      x: bounds.x + margin,
      y: bounds.y + margin,
      w: bounds.w - margin * 2,
      h: bounds.h - margin * 2
    };
  }

  /**
   * Очистить layout (для тестирования)
   */
  public clearLayout(): void {
    this.layout = null;
    logger.debug('CoordinateService layout cleared', { source: 'coordinate' });
  }
}
