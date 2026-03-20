import { eventBus } from '@/engine/events/EventBus';
import { logger } from '@/engine/logging';

export interface GestureOptions {
  tapMaxDuration: number;
  tapMaxDistance: number;
  doubleTapMaxInterval: number;
  longPressMinDuration: number;
  longPressMaxDistance: number;
  swipeMinDistance: number;
  swipeMinVelocity: number;
}

const DEFAULT_OPTIONS: GestureOptions = {
  tapMaxDuration: 300,
  tapMaxDistance: 10,
  doubleTapMaxInterval: 300,
  longPressMinDuration: 500,
  longPressMaxDistance: 10,
  swipeMinDistance: 50,
  swipeMinVelocity: 0.3,
};

export class GestureRecognizer {
  private static instance: GestureRecognizer;
  static getInstance(): GestureRecognizer {
    return (GestureRecognizer.instance ??= new GestureRecognizer());
  }

  private options: GestureOptions;
  private startPosition = { x: 0, y: 0 };
  private startTime = 0;
  private currentPosition = { x: 0, y: 0 };
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private lastTapTime = 0;
  private lastTapPosition = { x: 0, y: 0 };
  private isActive = false;
  private unsubscribes: (() => void)[] = [];

  private constructor(options: Partial<GestureOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  initialize(): void {
    this.unsubscribes.push(
      eventBus.on('pointer-start', (data) => this.onPointerStart(data.position)),
      eventBus.on('pointer-move', (data) => this.onPointerMove(data.position)),
      eventBus.on('pointer-end', () => this.onPointerEnd()),
    );
    logger.info('✅ GestureRecognizer initialized', { source: 'input' });
  }

  destroy(): void {
    this.cancelLongPress();
    for (const unsub of this.unsubscribes) unsub();
    this.unsubscribes.length = 0;
    logger.info('🧹 GestureRecognizer destroyed', { source: 'input' });
  }

  private onPointerStart(position: { x: number; y: number }): void {
    this.startPosition = { ...position };
    this.currentPosition = { ...position };
    this.startTime = performance.now();
    this.isActive = true;

    // Start long-press timer
    this.cancelLongPress();
    this.longPressTimer = setTimeout(() => {
      if (!this.isActive) return;
      const dist = this.distance(this.startPosition, this.currentPosition);
      if (dist <= this.options.longPressMaxDistance) {
        eventBus.emit('gesture-long-press', { position: { ...this.startPosition } });
        this.isActive = false; // Prevent tap on release
      }
    }, this.options.longPressMinDuration);
  }

  private onPointerMove(position: { x: number; y: number }): void {
    this.currentPosition = { ...position };

    // Cancel long-press if moved too far
    if (this.isActive && this.longPressTimer) {
      const dist = this.distance(this.startPosition, this.currentPosition);
      if (dist > this.options.longPressMaxDistance) {
        this.cancelLongPress();
      }
    }
  }

  private onPointerEnd(): void {
    this.cancelLongPress();
    if (!this.isActive) return;
    this.isActive = false;

    const endTime = performance.now();
    const duration = endTime - this.startTime;
    const dist = this.distance(this.startPosition, this.currentPosition);

    // Check swipe
    if (dist >= this.options.swipeMinDistance) {
      const velocity = dist / duration;
      if (velocity >= this.options.swipeMinVelocity) {
        const dx = this.currentPosition.x - this.startPosition.x;
        const dy = this.currentPosition.y - this.startPosition.y;
        const direction: 'left' | 'right' | 'up' | 'down' = Math.abs(dx) >= Math.abs(dy)
          ? (dx > 0 ? 'right' : 'left')
          : (dy > 0 ? 'down' : 'up');

        eventBus.emit('gesture-swipe', {
          direction,
          velocity,
          distance: dist,
          startPosition: { ...this.startPosition },
          endPosition: { ...this.currentPosition },
        });
        return;
      }
    }

    // Check tap
    if (duration < this.options.tapMaxDuration && dist < this.options.tapMaxDistance) {
      const now = endTime;
      const timeSinceLastTap = now - this.lastTapTime;
      const distFromLastTap = this.distance(this.startPosition, this.lastTapPosition);

      if (timeSinceLastTap < this.options.doubleTapMaxInterval && distFromLastTap < this.options.tapMaxDistance) {
        eventBus.emit('gesture-double-tap', { position: { ...this.startPosition } });
        this.lastTapTime = 0; // Reset to prevent triple-tap
      } else {
        eventBus.emit('gesture-tap', { position: { ...this.startPosition } });
        this.lastTapTime = now;
        this.lastTapPosition = { ...this.startPosition };
      }
    }
  }

  private cancelLongPress(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  private distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

export const gestureRecognizer = GestureRecognizer.getInstance();
