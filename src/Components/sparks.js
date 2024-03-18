import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Points,
  PointsMaterial,
  TextureLoader,
} from "three";
import { getRandomItem } from "../tools";

export default class Sparks {
  scene;
  starGeo;
  vertices;
  accelerations;
  velocities;
  stars;
  constructor(scene, count, color, opacity, accel) {
    this.scene = scene;
    const sprite = new TextureLoader().load("./images/spark1.png");
    this.starGeo = new BufferGeometry();
    this.vertices = [];
    this.accelerations = [];
    this.velocities = [];

    for (let i = 0; i < count; i++) {
      const x = this.getDefaultX();
      const y = this.getDefaultY();
      const z = this.getDefaultZ();
      this.vertices.push(x, y, z);
      this.velocities.push(0);
      this.accelerations.push(Math.random() * accel);
    }
    this.starGeo.setAttribute(
      "position",
      new Float32BufferAttribute(this.vertices, 3)
    );

    const starMaterial = new PointsMaterial({
      color: new Color(color),
      size: 1.0,
      opacity,
      transparent: true,
      map: sprite,
      blending: AdditiveBlending,
    });

    const stars = new Points(this.starGeo, starMaterial);

    this.scene.add(stars);
  }

  getDefaultY() {
    return -50;
  }
  getDefaultX() {
    return Math.random() * 100 - 50;
  }
  getDefaultZ() {
    return 2 + Math.random() * -50;
  }

  rendering(time) {
    const positionAttribute = this.starGeo.getAttribute("position");

    console.log(positionAttribute);
    for (let i = 0; i < positionAttribute.count; i++) {
      const accel = this.accelerations[i];
      let x = positionAttribute.getX(i);

      let y = positionAttribute.getY(i);
      let vel = this.velocities[i] + Math.sin(time);

      vel *= accel;
      x += Math.sin((time + i) / 10) * 0.2;
      y += accel;

      if (y >= 50) {
        vel = 0;
        y = this.getDefaultY();
        x = this.getDefaultX();
      }

      positionAttribute.setX(i, x);
      this.velocities[i] = vel;

      positionAttribute.setY(i, y);
    }
    positionAttribute.needsUpdate = true;
  }
}
