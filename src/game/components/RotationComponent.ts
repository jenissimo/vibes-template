// engine/components/VelocityComponent.ts
import { Component } from '@/engine/Component';

export class RotationComponent extends Component {
  speed: number;

  constructor(speed: number) {
    super();
    this.speed = speed;
  }

  update(dt: number) {
    this.gameObject.rotation += this.speed * dt;
  }
}

