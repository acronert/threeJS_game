import { MeshStandardMaterial, TextureLoader } from "three";
import { Chunk } from "./Chunk.js";

// const chunkDepth = {
//   VERY_LOW: {
//     depth: 32,
//     res: 8,
//   },
//   LOW: {
//     depth: 16,
//     res: 16,
//   },
//   MID: {
//     depth: 8,
//     res: 32,
//   },
//   HIGH: {
//     depth: 4,
//     res: 64
//   },
//   VERY_HIGH: {
//     depth: 2,
//     res: 128
//   }
// }

const chunkDepth = {
  VERY_LOW: {
    depth: 16,
    res: 8,
  },
  LOW: {
    depth: 8,
    res: 16,
  },
  MID: {
    depth: 4,
    res: 32,
  },
  HIGH: {
    depth: 2,
    res: 64
  },
  VERY_HIGH: {
    depth: 1,
    res: 128
  }
}

// Max number of chunks that are requested each time update() is triggered
const updateSize = 100;

export class ChunkManager {
  constructor(scene) {
    this.scene = scene;
    this.size = 32;

    // Needs to be initialized before use !
    this.material = new MeshStandardMaterial({ color: 0xff0000 });
    this.getHeightAt = (x, z) => 0;
    this.terrainType = "";

    this.loaded = new Map();
    this.requested = new Map();
    this.toRemove = new Map();

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

  // remove children (recursivly) + check if in requested list -> add to remove list
  removeRecursiveChildren(key) {
    if (!key)
      return;

    // Remove if the child is loaded
    if (this.loaded.has(key)) {
      const chunk = this.loaded.get(key).chunk;
      const childrenKeys = chunk.getChildrenChunksKeys();
      for (const childKey of childrenKeys) {
        this.removeRecursiveChildren(childKey);
      }

      chunk.removeFrom(this.scene);
      this.loaded.delete(key);
    }
    // Add to toRemove list if the child is requested (not loaded yet)
    // else if (this.requested.has(key)) {
    //   this.toRemove.add(key);
    // }
  }

  removeRecursiveParent(key) {
    if (!key || !this.loaded.has(key))
      return;

    if (this.loaded.has(key)) {
      const chunk = this.loaded.get(key).chunk;
      // recurse on the chunk's parent
      this.removeRecursiveParent(chunk.getParentChunkKey());

      // check if the chunk is ready for destruction
      const childrenKeys = chunk.getChildrenChunksKeys();
      let requestedChildren = false;
      for (const childKey of childrenKeys) {
        if (this.requested.has(childKey)) {
          requestedChildren = true;
          break;
        }
      }
      if (requestedChildren == false) {
        chunk.removeFrom(this.scene);
        this.loaded.delete(key);
      }
    }
    // Add to toRemove list if the parent is requested (not loaded yet)
    // else if (this.requested.has(key)) {
    //   this.toRemove.add(key);
    // }
  }

  // Triggers when the worker finished computing the heights of a chunk
  onWorkerMessage = (e) => {
    const { chunkX, chunkY, size, resolution, terrainType, heights, normals } = e.data;
    const key = `${chunkX},${chunkY},${size},${terrainType}`;

    // create it
    const chunk = new Chunk({ x: chunkX, y: chunkY }, size, resolution, heights, normals, this.material, this.terrainType);
    // add it to the scene
    chunk.addTo(this.scene);
    // if a chunk of the same size exists, replace it
    if (this.loaded.has(key)) {
      this.loaded.get(key).chunk?.removeFrom(this.scene);
      this.loaded.delete(key);
    }
    // add it to the loaded list
    this.loaded.set(key, { chunk, resolution });
    // remove the request
    this.requested.delete(key);

    // Remove children recursively
    const childrenKeys = chunk.getChildrenChunksKeys();
    for (const childKey of childrenKeys) {
      this.removeRecursiveChildren(childKey);
    }
    // Remove parents recursively
    const parentKey = chunk.getParentChunkKey();
    this.removeRecursiveParent(parentKey);

  };

  #getChunkCoordinates(x, z) {
    const cx = Math.floor((x + this.size) / this.size);
    const cz = Math.floor((z + this.size) / this.size);
    return { cx, cz };
  }

  // Return the chunks that are within the radius around the camera chunk
  // position as an array of [x, y, sqrDistance], sorted by sqrDistance
  #getNeededWithinRadius(x, z, radius) {
    const needed = [];
    const { cx, cz } = this.#getChunkCoordinates(x, z);

    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        let sqrDistance = dx * dx + dz * dz;
        if (sqrDistance <= radius ** 2)
          needed.push([cx + dx, cz + dz, sqrDistance]);
      }
    }
    needed.sort((a, b) => a[2] - b[2]); // sort by distance to camera chunk
    return needed;
  }

  // Returns the resolution based on the distance
  #getChunkResolution(sqrDistance) {
    if (sqrDistance <= chunkDepth.VERY_HIGH.depth ** 2) return chunkDepth.VERY_HIGH.res;
    if (sqrDistance <= chunkDepth.HIGH.depth ** 2) return chunkDepth.HIGH.res;
    if (sqrDistance <= chunkDepth.MID.depth ** 2) return chunkDepth.MID.res;
    if (sqrDistance <= chunkDepth.LOW.depth ** 2) return chunkDepth.LOW.res;
    return chunkDepth.VERY_LOW.res;
  }

  #requestChunk(chunkX, chunkY, resolution) {
    const key = `${chunkX},${chunkY},${this.size},${this.terrainType}`;
    const worker = this.workers[this.workerIndex];
    this.workerIndex = (this.workerIndex + 1) % this.workers.length;

    worker.postMessage({
      chunkX,
      chunkY,
      size: this.size,
      resolution,
      terrainType: this.terrainType
    });
    this.requested.set(key, { resolution });
  }

  // Check if the key have a child or a parent that is in the needed list
  haveANeededRelative(key, neededKey) {
    const parentKey = this.loaded.get(key).chunk.getParentChunkKey();
    if (neededKey.has(parentKey)) {
      return true;
    }
    const childrenKeys = this.loaded.get(key).chunk.getChildrenChunksKeys();
    for (const child of childrenKeys) {
      if (neededKey.has(child))
        return true;
    }
    return false;
  }

  #removeOldChunks(needed) {
    // create a set from needed to be able to check by key
    const neededKey = new Set();
    for (const [chunkX, chunkY] of needed) {
      neededKey.add(`${chunkX},${chunkY},${this.size},${this.terrainType}`);
    }

    // Remove all chunks are not not in needed list
    //  AND dont have a needed relative (parent or child)
    for (let key of this.loaded.keys()) {
      if (!neededKey.has(key) && !this.haveANeededRelative(key, neededKey)) {
        const chunk = this.loaded.get(key).chunk;
        chunk.removeFrom(this.scene);
        this.loaded.delete(key);
      }
    }

    // Remove keys in the toRemove list (they were still loading when could have
    //  been replaced). Just need to wait for the chunk to exist
    for (let key of this.toRemove) {
      if (this.loaded.has(key)) {
        const chunk = this.loaded.get(key).chunk;
        chunk.removeFrom(this.scene);
        this.loaded.delete(key);
        this.toRemove.delete(key);
      }
    }
  }


  getChunkSize(altitude) {
    const MAX_SIZE = 16384;

    let ceiling = 64;
    let size = 32;
    while (ceiling <= MAX_SIZE) {
      if (altitude < ceiling) {
        return size;
      }
      size *= 2;
      ceiling *= 2;
    }
    return MAX_SIZE;
  }

  updateMaterialTextures() {
    const map = this.material.map;
    const normalMap = this.material.normalMap;
    const roughnessMap = this.material.roughnessMap;
    const aoMap = this.material.aoMap;

    map?.repeat.set(this.size / 8, this.size / 8);
    normalMap?.repeat.set(this.size / 8, this.size / 8);
    roughnessMap?.repeat.set(this.size / 8, this.size / 8);
    aoMap?.repeat.set(this.size / 8, this.size / 8);

    // [map, normalMap, roughnessMap, aoMap].forEach(tex => {
    //   tex.repeat.set(this.size / 8, this.size / 8);
    // });
  }

  update(position) {
    let nRequest = this.requested.size;
    this.size = this.getChunkSize(position.y);
    this.updateMaterialTextures();
    let needed = this.#getNeededWithinRadius(position.x, position.z, chunkDepth.VERY_LOW.depth);

    // console.log(`Loaded chunks:${this.loaded.size} | Requested chunks:${this.requested.size}`);

    for (const [chunkX, chunkY, sqrDistance] of needed) {
      if (nRequest > updateSize) break;
      const resolution = this.#getChunkResolution(sqrDistance);
      const key = `${chunkX},${chunkY},${this.size},${this.terrainType}`;

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

  getChunkMesh(x, z) {
    const { cx, cz } = this.#getChunkCoordinates(x, z);
    const key = `${cx},${cz},${this.size},${this.terrainType}`;

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
