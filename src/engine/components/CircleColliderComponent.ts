// engine/components/CircleColliderComponent.ts
import { Component } from '@/engine/Component';

export interface CircleColliderConfig {
  radius: number;
  isTrigger?: boolean;
  bounciness?: number; // 0..1 override for restitution
  friction?: number; // 0..1 simple tangential damping on collision
  collideWithBounds?: boolean;
}

export class CircleColliderComponent extends Component {
  radius: number;
  isTrigger: boolean;
  bounciness: number;
  friction: number;
  collideWithBounds: boolean;

  constructor(cfg: CircleColliderConfig) {
    super();
    this.radius = cfg.radius;
    this.isTrigger = cfg.isTrigger ?? false;
    this.bounciness = Math.min(1, Math.max(0, cfg.bounciness ?? 0.6));
    this.friction = Math.min(1, Math.max(0, cfg.friction ?? 0.02));
    this.collideWithBounds = cfg.collideWithBounds ?? true;
  }
}


