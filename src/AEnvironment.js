
export class AEnvironment {
  constructor(scene, camera, chunkManager, player) {
    this.scene = scene;
    this.camera = camera;
    this.chunkManager = chunkManager;
    this.player = player;
  }

  updateChunks() {
    throw new Error("update() must be implemented in subclass");
  }
}

import { getDesertHeightAt } from "./PerlinNoise.js";
import { createSandMaterial } from "./Materials.js";

export class DesertEnvironment extends AEnvironment {
  constructor(scene, camera, chunkManager, player) {
    super(scene, camera, chunkManager, player);

    console.log("DesertEnvironment constructor");
    this.heightFunction = getDesertHeightAt;
    this.material = createSandMaterial();

    this.chunkManager.init(this.material, this.heightFunction, "DESERT");
    this.player.updateTracksColor(this.material.map);
  }

  updateChunks() {
    this.chunkManager.update(this.camera.position);
    // this.chunkManager.updateCurvature(); // OPTIONAL
  }
}

import { getSnowHeightAt } from "./PerlinNoise.js";
import { createSnowMaterial } from "./Materials.js";

export class SnowEnvironment extends AEnvironment {
  constructor(scene, camera, chunkManager, player) {
    super(scene, camera, chunkManager, player);

    console.log("SnowEnvironment constructor");
    this.heightFunction = getSnowHeightAt;
    this.material = createSnowMaterial();

    this.chunkManager.init(this.material, this.heightFunction, "SNOW");
    this.player.updateTracksColor(this.material.map);
  }

  updateChunks() {
    this.chunkManager.update(this.camera.position);
    // this.chunkManager.updateCurvature(); // OPTIONAL
  }
}
