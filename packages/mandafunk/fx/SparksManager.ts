import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  NormalBlending,
  Points,
  PointsMaterial,
  Scene,
  TextureLoader,
} from "three";
import type { SparksConfig, SparkEmitter } from "../config/types";

interface EmitterInstance {
  config: SparkEmitter;
  geometry: BufferGeometry;
  points: Points;
  velocities: Float32Array;
  accelerations: Float32Array;
}

export class SparksManager {
  private emitters: Map<string, EmitterInstance> = new Map();
  private scene: Scene;
  private textureLoader: TextureLoader = new TextureLoader();

  constructor(scene: Scene) {
    this.scene = scene;
  }

  update(config: SparksConfig | undefined): void {
    if (!config || !config.enabled) {
      this.disposeAll();
      return;
    }

    const activeIds = new Set(config.emitters.map((e) => e.id));

    // Remove deleted emitters
    for (const [id, instance] of this.emitters) {
      if (!activeIds.has(id)) {
        this.scene.remove(instance.points);
        instance.geometry.dispose();
        (instance.points.material as PointsMaterial).dispose();
        this.emitters.delete(id);
      }
    }

    // Add or update emitters
    for (const emitterConfig of config.emitters) {
      const existing = this.emitters.get(emitterConfig.id);
      if (existing) {
        this.updateEmitter(existing, emitterConfig);
      } else {
        this.createEmitter(emitterConfig);
      }
    }
  }

  private createEmitter(config: SparkEmitter): void {
    const geometry = new BufferGeometry();
    const vertices: number[] = [];
    const velocities = new Float32Array(config.count);
    const accelerations = new Float32Array(config.count);

    const origin = config.emissionOrigin;
    for (let i = 0; i < config.count; i++) {
      vertices.push(
        origin.x + (Math.random() * 100 - 50),
        origin.y,
        origin.z + 2 + Math.random() * -50,
      );
      velocities[i] = 0;
      accelerations[i] = Math.random() * config.acceleration;
    }

    geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));

    const material = new PointsMaterial({
      color: new Color(config.color),
      size: config.size,
      opacity: config.opacity,
      transparent: true,
      blending: config.blending === "additive" ? AdditiveBlending : NormalBlending,
    });

    // Load sprite if specified
    if (config.sprite) {
      this.textureLoader.load(config.sprite, (texture) => {
        material.map = texture;
        material.needsUpdate = true;
      });
    }

    const points = new Points(geometry, material);
    points.visible = !config.muted;
    this.scene.add(points);

    this.emitters.set(config.id, {
      config,
      geometry,
      points,
      velocities,
      accelerations,
    });
  }

  private updateEmitter(instance: EmitterInstance, config: SparkEmitter): void {
    const material = instance.points.material as PointsMaterial;
    material.color.set(config.color);
    material.size = config.size;
    material.opacity = config.opacity;
    material.blending = config.blending === "additive" ? AdditiveBlending : NormalBlending;
    instance.points.visible = !config.muted;

    // Rebuild if count changed
    if (config.count !== instance.config.count) {
      this.scene.remove(instance.points);
      instance.geometry.dispose();
      material.dispose();
      this.emitters.delete(config.id);
      this.createEmitter(config);
      return;
    }

    instance.config = config;
  }

  rendering(time: number): void {
    for (const instance of this.emitters.values()) {
      if (instance.config.muted) continue;

      const pos = instance.geometry.getAttribute("position");
      const config = instance.config;
      const origin = config.emissionOrigin;

      for (let i = 0; i < pos.count; i++) {
        const accel = instance.accelerations[i];
        let x = pos.getX(i);
        let y = pos.getY(i);
        let vel = instance.velocities[i] + Math.sin(time);
        vel *= accel;

        // Apply perturbation
        if (config.perturbation.enabled) {
          x += Math.sin((time + i) / config.perturbation.frequency) * config.perturbation.amplitude;
        } else {
          x += Math.sin((time + i) / 10) * 0.2;
        }

        // Move based on direction
        switch (config.emissionDirection) {
          case "up":
            y += accel;
            if (y >= origin.y + 100) {
              vel = 0;
              y = origin.y;
              x = origin.x + (Math.random() * 100 - 50);
            }
            break;
          case "down":
            y -= accel;
            if (y <= origin.y - 100) {
              vel = 0;
              y = origin.y;
              x = origin.x + (Math.random() * 100 - 50);
            }
            break;
          case "left":
            x -= accel;
            if (x <= origin.x - 100) {
              vel = 0;
              x = origin.x;
              y = origin.y + (Math.random() * 100 - 50);
            }
            break;
          case "right":
            x += accel;
            if (x >= origin.x + 100) {
              vel = 0;
              x = origin.x;
              y = origin.y + (Math.random() * 100 - 50);
            }
            break;
          case "radial":
            y += accel * Math.cos(i);
            x += accel * Math.sin(i);
            if (Math.abs(y - origin.y) > 100 || Math.abs(x - origin.x) > 100) {
              vel = 0;
              y = origin.y;
              x = origin.x + (Math.random() * 100 - 50);
            }
            break;
        }

        pos.setX(i, x);
        pos.setY(i, y);
        instance.velocities[i] = vel;
      }
      pos.needsUpdate = true;
    }
  }

  dispose(): void {
    this.disposeAll();
  }

  private disposeAll(): void {
    for (const [id, instance] of this.emitters) {
      this.scene.remove(instance.points);
      instance.geometry.dispose();
      (instance.points.material as PointsMaterial).dispose();
      this.emitters.delete(id);
    }
  }
}
