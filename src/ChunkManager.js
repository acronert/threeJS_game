import { MeshStandardMaterial } from "three";
import { Chunk } from "./Chunk.js";

// For each Level Of Details (LOD),
// set the chunk distance (in chunk size) and resolution
const chunkDepth = {
  LOW: {
    depth: 12,
    res: 16,
  },
  MID: {
    depth: 6,
    res: 64,
  },
  HIGH: {
    depth: 2,
    res: 128
  }
}

// Max number of chunks that are requested each time update() is triggered
const updateSize = 40;

export class ChunkManager {
  constructor(scene, camera, chunkSize) {
    this.camera = camera;
    this.scene = scene;
    this.chunkSize = chunkSize;

    // Needs to be initialized before use !
    this.material = new MeshStandardMaterial({ color: 0xff0000 });
    this.getHeightAt = (x, z) => 0;
    this.terrainType = "";

    this.loaded = new Map();
    this.requested = new Map();

    // Worker list
    this.workers = [];
    this.workerIndex = 0;
    // number of workers = number of CPU cores / 2
    const workerCount = Math.max(1, Math.floor(navigator.hardwareConcurrency / 2));
    for (let i = 0; i < workerCount; i++) {
      const worker = new Worker("src/Worker.js", { type: "module" });
      worker.onmessage = this.onWorkerMessage.bind(this);
      this.workers.push(worker);
    }
  }

  init(material, heightFunction, terrainType) {
    this.material = material;
    this.getHeightAt = heightFunction;
    this.terrainType = terrainType;
    console.log("ChunkManager changed to type:", this.terrainType);
  }

  // Triggers when the worker finished computing the heights of a chunk
  onWorkerMessage = (e) => {
    const { chunkX, chunkY, resolution, terrainType, heights, normals } = e.data;
    const key = `${chunkX},${chunkY},${terrainType}`;
    const chunk = new Chunk({ x: chunkX, y: chunkY }, this.chunkSize, resolution, heights, normals, this.material);
    chunk.addTo(this.scene);

    // remove the request
    this.requested.delete(key);
    // remove the previous LOD chunk if it exist
    if (this.loaded.has(key)) {
      this.loaded.get(key).chunk.removeFrom(this.scene);
      this.loaded.delete(key);
    }
    // put new chunk in chunks
    this.loaded.set(key, { chunk, resolution });
    // console.log("number of loaded chunks:", this.loaded.size);
  };

  #getChunkCoordinates(x, y) {
    const cx = Math.floor((x + this.chunkSize / 2) / this.chunkSize);
    const cy = Math.floor((y + this.chunkSize / 2) / this.chunkSize);
    return { cx, cy };
  }

  // Return the chunks that are within the radius around the camera chunk
  // position as an array of [x, y, sqrDistance], sorted by sqrDistance
  #getNeededWithinRadius(radius) {
    const needed = [];
    const { cx, cy } = this.#getChunkCoordinates(this.camera.position.x, this.camera.position.z);

    for (let x = -radius; x <= radius; x++) {
      for (let y = -radius; y <= radius; y++) {
        let sqrDistance = x * x + y * y;
        if (sqrDistance <= radius ** 2)
          needed.push([cx + x, cy + y, sqrDistance]);
      }
    }
    needed.sort((a, b) => a[2] - b[2]); // sort by distance to camera chunk
    return needed;
  }

  // Returns the resolution based on the distance
  #getChunkResolution(sqrDistance) {
    if (sqrDistance <= chunkDepth.HIGH.depth ** 2) return chunkDepth.HIGH.res;
    if (sqrDistance <= chunkDepth.MID.depth ** 2) return chunkDepth.MID.res;
    return chunkDepth.LOW.res;
  }

  #requestChunk(chunkX, chunkY, resolution) {
    const key = `${chunkX},${chunkY},${this.terrainType}`;
    const worker = this.workers[this.workerIndex];
    this.workerIndex = (this.workerIndex + 1) % this.workers.length;

    worker.postMessage({
      chunkX,
      chunkY,
      size: this.chunkSize,
      resolution,
      terrainType: this.terrainType
    });
    this.requested.set(key, { resolution });
  }

  // Remove chunks that are not needed anymore
  #removeOldChunks(needed) {
    // create a set from needed to be able to check by key
    const neededKey = new Set();
    for (const [chunkX, chunkY] of needed) {
      neededKey.add(`${chunkX},${chunkY},${this.terrainType}`);
    }

    for (let key of this.loaded.keys()) {
      if (!neededKey.has(key)) {
        const chunk = this.loaded.get(key).chunk;
        chunk.removeFrom(this.scene);
        this.loaded.get(key)
        this.loaded.delete(key);
      }
    }
  }

  update() {
    let nRequest = this.requested.size;
    let needed = this.#getNeededWithinRadius(chunkDepth.LOW.depth);

    for (const [chunkX, chunkY, sqrDistance] of needed) {
      if (nRequest > updateSize) break;
      const resolution = this.#getChunkResolution(sqrDistance);
      const key = `${chunkX},${chunkY},${this.terrainType}`;

      if (!this.requested.has(key)          // Not requested
        && (!this.loaded.has(key)         // ... and ( not loaded ...
          || (this.loaded.get(key).resolution != resolution))) { // ... or need to change scale)
        this.#requestChunk(chunkX, chunkY, resolution);
        nRequest++;
      }
    }
    this.#removeOldChunks(needed);
  }

  // disposeChunks() {
  //   for (const chunk of this.loaded) {
  //     chunk.removeFrom(this.scene)
  //   }
  // }

  getChunkMesh(x, y) {
    const { cx, cy } = this.#getChunkCoordinates(x, y);
    const key = `${cx},${cy},${this.terrainType}`;

    if (this.loaded.has(key)) {
      return this.loaded.get(key).chunk.getMesh();
    }
    return null;
  }

  updateCurvature(camera) {
    // Update the curvature shader effect
    if (this.material.userData.update) {
      this.material.userData.update(camera);
    }
  }
}
