import * as THREE from "three";

import { getDesertHeightAt } from "./PerlinNoise.js";
import { createSandMaterial } from "./Materials.js";

import { getSnowHeightAt } from "./PerlinNoise.js";
import { createSnowMaterial } from "./Materials.js";

import { getPlanetHeightAt } from "./PerlinNoise.js";
import { createPlanetMaterial } from "./Materials.js";

import { ChunkManager } from "./ChunkManager.js";



export class World {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;

    this.getHeightAt = (x, y) => 0;
    this.material = ({ color: 0x00ff00 });

    this.chunkManager = new ChunkManager(this.scene);

    // this.environment = new DesertEnvironment(this.scene, this.camera, this.chunkManager);
  }

  // Recalculate chunks
  update() {
    this.chunkManager.update(this.camera.position);
  }

  getMaterialColor() {
    return this.material.map;
  }

  setWorldType(type) {
    switch (type) {
      case "DESERT": {
        this.getHeightAt = getDesertHeightAt;
        this.material = createSandMaterial();

        this.chunkManager.init(
          this.material,
          this.getHeightAt,
          type
        );
        break;
      }
      case "SNOW": {
        this.getHeightAt = getSnowHeightAt;
        this.material = createSnowMaterial();

        this.chunkManager.init(
          this.material,
          this.getHeightAt,
          type
        );
        break;
      }
      case "PLANET": {
        this.getHeightAt = getPlanetHeightAt;
        this.material = createPlanetMaterial();

        this.chunkManager.init(
          this.material,
          this.getHeightAt,
          type
        );
        break;
      }
    }
  }
}