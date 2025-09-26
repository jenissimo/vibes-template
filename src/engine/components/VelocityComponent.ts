// engine/components/VelocityComponent.ts
import { Component } from '@/engine/Component';

export interface VelocityConfig {
  vx?: number;
  vy?: number;
  angular?: number;
  mass?: number; // kilograms-equivalent (arbitrary units)
  restitution?: number; // 0..1
  linearDamping?: number; // per second
  angularDamping?: number; // per second
  immovable?: boolean;
}

export class VelocityComponent extends Component {
  vx: number;
  vy: number;
  angular: number;
  mass: number;
  restitution: number;
  linearDamping: number;
  angularDamping: number;
  immovable: boolean;

  constructor(cfg: VelocityConfig = {}) {
    super();
    this.vx = cfg.vx ?? 0;
    this.vy = cfg.vy ?? 0;
    this.angular = cfg.angular ?? 0;
    this.mass = Math.max(0.0001, cfg.mass ?? 1);
    this.restitution = Math.min(1, Math.max(0, cfg.restitution ?? 0.6));
    this.linearDamping = Math.max(0, cfg.linearDamping ?? 0.8);
    this.angularDamping = Math.max(0, cfg.angularDamping ?? 1.0);
    this.immovable = cfg.immovable ?? false;
  }
}


