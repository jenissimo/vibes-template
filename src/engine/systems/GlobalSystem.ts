// engine/systems/GlobalSystem.ts
import type { Game } from '../Game';
import { logger } from '../logging';

/**
 * Base class for systems that survive scene transitions.
 * Attached to Game instead of Scene (e.g. AudioSystem, AnalyticsSystem, AchievementSystem).
 */
export abstract class GlobalSystem {
  protected game: Game;
  protected isStarted = false;
  protected isDestroyed = false;

  constructor(game: Game) {
    this.game = game;
  }

  start(): void {
    if (this.isStarted) return;
    this.isStarted = true;
    this.onStart();
    logger.info(`▶️ ${this.constructor.name} started (global)`);
  }

  stop(): void {
    if (!this.isStarted) return;
    this.isStarted = false;
    this.onStop();
  }

  update(deltaTime: number): void {
    if (!this.isStarted || this.isDestroyed) return;
    this.onUpdate(deltaTime);
  }

  destroy(): void {
    if (this.isDestroyed) return;
    this.stop();
    this.onDestroy();
    this.isDestroyed = true;
    logger.info(`💥 ${this.constructor.name} destroyed (global)`);
  }

  get started(): boolean { return this.isStarted; }
  get destroyed(): boolean { return this.isDestroyed; }

  protected onStart(): void {}
  protected onStop(): void {}
  protected onUpdate(_deltaTime: number): void {}
  protected onDestroy(): void {}
}
