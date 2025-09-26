// engine/systems/PhysicsSystem.ts
import { System } from './System';
import { Scene } from '@/engine/scene/Scene';
import { GameObject } from '@/engine/GameObject';
import { RENDER_CONFIG } from '@/engine/render/RenderConfig';
import { VelocityComponent, CircleColliderComponent } from '@/engine/components';

interface Bounds {
  x: number; y: number; w: number; h: number;
}

export class PhysicsSystem extends System {
  private bounds: Bounds;
  private gravity: { x: number, y: number };
  // Safety caps to keep motion stable on mobile
  private readonly maxFallSpeed = 360; // px/sec downward cap for fragments
  private readonly maxAngularSpeed = 6; // rad/sec cap

  constructor(
    scene: Scene, 
    bounds: Bounds = { x: 0, y: 0, w: RENDER_CONFIG.referenceResolution.w, h: RENDER_CONFIG.referenceResolution.h },
    gravity: { x: number, y: number } = { x: 0, y: 0 }
  ) {
    super(scene);
    this.bounds = bounds;
    this.gravity = gravity;
  }

  setBounds(bounds: Bounds) { this.bounds = bounds; }
  setGravity(gravity: { x: number, y: number }) { this.gravity = gravity; }

  protected onUpdate(dt: number): void {
    const objects = this.collectBodies();
    this.integrate(objects, dt);
    this.resolveBounds(objects);
    this.resolvePairs(objects);
    
  }

  private collectBodies(): GameObject[] {
    const gos: GameObject[] = [];
    let totalObjects = 0;
    let activeObjects = 0;
    let withVelocity = 0;
    let withCollider = 0;
    let withBoundsCollision = 0;

    for (const go of this.scene.gameObjects) {
      totalObjects++;
      if (!go.active) continue;
      activeObjects++;
      
      if (!go.has(VelocityComponent)) continue;
      withVelocity++;
      
      const collider = go.get(CircleColliderComponent);
      if (!collider) continue;
      withCollider++;
      
      // The PhysicsSystem should only manage objects that are meant to collide.
      if (!collider.collideWithBounds) continue;
      withBoundsCollision++;
      
      gos.push(go);
    }

    return gos;
  }

  private integrate(gos: GameObject[], dt: number) {
    for (const go of gos) {
      const v = go.require(VelocityComponent);
      const c = go.get(CircleColliderComponent);

      // Apply gravity
      if (!v.immovable) {
        v.vx += this.gravity.x * dt;
        v.vy += this.gravity.y * dt;
      }

      // Apply damping (exponential decay)
      const linD = Math.max(0, 1 - v.linearDamping * dt);
      const angD = Math.max(0, 1 - v.angularDamping * dt);
      v.vx *= linD; v.vy *= linD; v.angular *= angD;

      // Clamp speeds for fragment bodies only (collideWithBounds=true)
      if (c && c.collideWithBounds) {
        // Vertical terminal velocity
        if (v.vy > this.maxFallSpeed) v.vy = this.maxFallSpeed;
        if (v.vy < -this.maxFallSpeed) v.vy = -this.maxFallSpeed;
        // Angular speed cap to avoid crazy spins
        if (v.angular > this.maxAngularSpeed) v.angular = this.maxAngularSpeed;
        if (v.angular < -this.maxAngularSpeed) v.angular = -this.maxAngularSpeed;
      }

      // Integrate
      go.x += v.vx * dt;
      go.y += v.vy * dt;
      go.rotation += v.angular * dt;
    }
  }

  private resolveBounds(gos: GameObject[]) {
    const b = this.bounds;
    for (const go of gos) {
      const v = go.require(VelocityComponent);
      const c = go.require(CircleColliderComponent);
      if (!c.collideWithBounds) continue;

      // Left/Right
      if (go.x - c.radius < b.x) {
        go.x = b.x + c.radius;
        if (!v.immovable) {
          v.vx = -v.vx * (c.bounciness * v.restitution);
          // Prevent objects from getting stuck with very small velocities
          if (Math.abs(v.vx) < 20) v.vx = v.vx > 0 ? 20 : -20;
        }
      } else if (go.x + c.radius > b.x + b.w) {
        go.x = b.x + b.w - c.radius;
        if (!v.immovable) {
          v.vx = -v.vx * (c.bounciness * v.restitution);
          // Prevent objects from getting stuck with very small velocities
          if (Math.abs(v.vx) < 20) v.vx = v.vx > 0 ? 20 : -20;
        }
      }

      // Top/Bottom (only if bounds are finite)
      if (b.y !== -Infinity && go.y - c.radius < b.y) {
        go.y = b.y + c.radius;
        if (!v.immovable) {
          v.vy = -v.vy * (c.bounciness * v.restitution);
          if (Math.abs(v.vy) < 10) v.vy = v.vy > 0 ? 10 : -10;
        }
      } else if (b.h !== Infinity && go.y + c.radius > b.y + b.h) {
        go.y = b.y + b.h - c.radius;
        if (!v.immovable) {
          v.vy = -v.vy * (c.bounciness * v.restitution);
          if (Math.abs(v.vy) < 10) v.vy = v.vy > 0 ? 10 : -10;
        }
      }
    }
  }

  private resolvePairs(gos: GameObject[]) {
    for (let i = 0; i < gos.length; i++) {
      for (let j = i + 1; j < gos.length; j++) {
        const a = gos[i];
        const b = gos[j];
        const ca = a.require(CircleColliderComponent);
        const cb = b.require(CircleColliderComponent);
        const va = a.require(VelocityComponent);
        const vb = b.require(VelocityComponent);

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const r = ca.radius + cb.radius;
        const distSq = dx * dx + dy * dy;
        if (distSq <= 0) continue;
        if (distSq > r * r) continue;

        const dist = Math.sqrt(distSq);
        const nx = dx / dist;
        const ny = dy / dist;
        const penetration = r - dist;

        // Positional correction (split proportionally by mass, skip immovable)
        const invMa = va.immovable ? 0 : 1 / va.mass;
        const invMb = vb.immovable ? 0 : 1 / vb.mass;
        const invMsum = invMa + invMb;
        if (invMsum > 0) {
          const corr = penetration / invMsum * 0.5; // split correction
          if (invMa > 0) { a.x -= nx * corr * invMa; a.y -= ny * corr * invMa; }
          if (invMb > 0) { b.x += nx * corr * invMb; b.y += ny * corr * invMb; }
        }

        // Relative velocity along normal
        const rvx = vb.vx - va.vx;
        const rvy = vb.vy - va.vy;
        const velAlongNormal = rvx * nx + rvy * ny;
        if (velAlongNormal > 0) continue; // separating

        const e = Math.min(ca.bounciness * va.restitution, cb.bounciness * vb.restitution);

        const jImpulse = -(1 + e) * velAlongNormal / (invMa + invMb || 1);
        const impulseX = jImpulse * nx;
        const impulseY = jImpulse * ny;

        if (invMa > 0) { va.vx -= impulseX * invMa; va.vy -= impulseY * invMa; }
        if (invMb > 0) { vb.vx += impulseX * invMb; vb.vy += impulseY * invMb; }

        // Simple tangential friction
        const tvx = rvx - velAlongNormal * nx;
        const tvy = rvy - velAlongNormal * ny;
        const tLen = Math.hypot(tvx, tvy) || 1;
        const tx = tvx / tLen;
        const ty = tvy / tLen;
        const mu = Math.min(ca.friction, cb.friction);
        const jt = -mu * (rvx * tx + rvy * ty) / (invMa + invMb || 1);
        if (invMa > 0) { va.vx -= jt * tx * invMa; va.vy -= jt * ty * invMa; }
        if (invMb > 0) { vb.vx += jt * tx * invMb; vb.vy += jt * ty * invMb; }
      }
    }
  }
}


