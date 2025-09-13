import { MeshStandardMaterial } from "three";
import { Chunk } from "./Chunk.js";

// For each Level Of Details (LOD),
// set the chunk distance (in chunk size) and resolution
// const chunkDepth = {
//   LOW: {
//     depth: 16,
//     res: 16,
//   },
//   MID: {
//     depth: 6,
//     res: 64,
//   },
//   HIGH: {
//     depth: 2,
//     res: 128
//   }
// }

const chunkDepth = {
  LOW: {
    depth: 8,
    res: 16,
  },
  MID: {
    depth: 4,
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
    if (!this.loaded.has(key))
      return;

    const chunk = this.loaded.get(key).chunk;
    const childrenKeys = chunk.getChildrenChunksKeys();
    for (const childKey of childrenKeys) {
      if (this.loaded.has(childKey)) {
        this.removeRecursiveChildren(childKey);
        this.loaded.get(childKey).chunk?.removeFrom(this.scene);
        this.loaded.delete(childKey);
      }
    }
  }

  removeRecursiveParent(key) {
    if (!this.loaded.has(key))
      return;

    const chunk = this.loaded.get(key).chunk;
    const parentKey = chunk.getParentChunkKey();
    if (this.loaded.has(parentKey)) {
      const parentChunk = this.loaded.get(parentKey).chunk;
      if (parentChunk) {
        const brothersKeys = parentChunk.getChildrenChunksKeys();
        // if no brothers are requested, it means that they are all loaded or not needed
        let requestedBrothers = 0;
        for (const bro of brothersKeys) {
          if (this.requested.has(bro))
            requestedBrothers++;
        }
        if (!requestedBrothers) {
          // remove parent (recursivly todo) + check if in requested list -> add to remove list
          this.removeRecursiveParent(parentKey);
          parentChunk.removeFrom(this.scene);
          this.loaded.delete(parentKey);
        }
      }
    }
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

    // Remove childrens recursively
    const childrenKeys = chunk.getChildrenChunksKeys();
    for (const childKey of childrenKeys) {
      if (this.loaded.has(childKey)) {
        this.removeRecursiveChildren(childKey);
        this.loaded.get(childKey).chunk?.removeFrom(this.scene);
        this.loaded.delete(childKey);
      }
    }

    // Check for parent chunk
    // Remove parents recursively
    const parentKey = chunk.getParentChunkKey();
    if (this.loaded.has(parentKey)) {
      const parentChunk = this.loaded.get(parentKey).chunk;
      if (parentChunk) {
        const brothersKeys = parentChunk.getChildrenChunksKeys();
        // if no brothers are requested, it means that they are all loaded or not needed
        let requestedBrothers = 0;
        for (const bro of brothersKeys) {
          if (this.requested.has(bro))
            requestedBrothers++;
        }
        if (!requestedBrothers) {
          // remove parent (recursivly todo) + check if in requested list -> add to remove list
          parentChunk.removeFrom(this.scene);
          this.loaded.delete(parentKey);
        }
      }
    }
  };

  #getChunkCoordinates(x, z) {
    const cx = Math.floor((x + this.size / 2) / this.size);
    const cz = Math.floor((z + this.size / 2) / this.size);
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
    if (sqrDistance <= chunkDepth.HIGH.depth ** 2) return chunkDepth.HIGH.res;
    if (sqrDistance <= chunkDepth.MID.depth ** 2) return chunkDepth.MID.res;
    return chunkDepth.LOW.res;
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

  // Remove chunks that are not needed anymore
  #removeOldChunks(needed) {
    // create a set from needed to be able to check by key
    const neededKey = new Set();
    for (const [chunkX, chunkY] of needed) {
      neededKey.add(`${chunkX},${chunkY},${this.size},${this.terrainType}`);
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

  getChunkSize(altitude) {
    if (altitude < 64) return 32;
    else if (altitude < 128) return 64;
    else if (altitude < 256) return 128;
    else if (altitude < 512) return 256;
    else if (altitude < 1024) return 512;
    else return 1024;
  }

  update(position) {
    let nRequest = this.requested.size;
    this.size = this.getChunkSize(position.y);
    let needed = this.#getNeededWithinRadius(position.x, position.z, chunkDepth.LOW.depth);

    for (const [chunkX, chunkY, sqrDistance] of needed) {
      if (nRequest > updateSize) break;
      const resolution = this.#getChunkResolution(sqrDistance);
      const key = `${chunkX},${chunkY},${this.size},${this.terrainType}`;

      // console.log(`request?:${key}`)
      if (!this.requested.has(key)          // Not requested
        && (!this.loaded.has(key)         // ... and ( not loaded ...
          || (this.loaded.get(key).resolution != resolution))) { // ... or need to change scale)
        // console.log(`request:${key}`)
        this.#requestChunk(chunkX, chunkY, resolution);
        nRequest++;
      }
    }
    // this.#removeOldChunks(needed);
  }

  // disposeChunks() {
  //   for (const chunk of this.loaded) {
  //     chunk.removeFrom(this.scene)
  //   }
  // }

  getChunkMesh(x, y) {
    const { cx, cy } = this.#getChunkCoordinates(x, y);
    const key = `${cx},${cy},${this.size},${this.terrainType}`;

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












// each time I get a chunk
//   add the chunk to the scene
//   if another chunk of the same size but different resolution exists
//    replace it
//   destroy smaller chunks covered by this chunk, recusively going down
//   if there is a bigger chunk covering this chunk
//     if there is no other chunk covered by the bigger chunk in the loaded or requested list
//       destroy the bigger chunk, recursively going up
// remove all chunks that are too far from the current position











////////////////////////////////////////////////////////////////////////////////

// import { MeshStandardMaterial } from "three";
// import { Chunk } from "./Chunk.js";

// // For each Level Of Details (LOD),
// // set the chunk distance (in chunk size) and resolution
// const chunkDepth = {
//   LOW: {
//     depth: 16,
//     res: 16,
//   },
//   MID: {
//     depth: 6,
//     res: 64,
//   },
//   HIGH: {
//     depth: 2,
//     res: 128
//   }
// }

// // Max number of chunks that are requested each time update() is triggered
// const updateSize = 40;

// export class ChunkManager {
//   constructor(scene) {
//     this.scene = scene;
//     this.size = 32;

//     // Needs to be initialized before use !
//     this.material = new MeshStandardMaterial({ color: 0xff0000 });
//     this.getHeightAt = (x, z) => 0;
//     this.terrainType = "";

//     this.loaded = new Map();
//     this.requested = new Map();

//     // Worker list
//     this.workers = [];
//     this.workerIndex = 0;
//     // number of workers = number of CPU cores / 2
//     const workerCount = Math.max(1, Math.floor(navigator.hardwareConcurrency / 2));
//     for (let i = 0; i < workerCount; i++) {
//       const worker = new Worker("src/Worker.js", { type: "module" });
//       worker.onmessage = this.onWorkerMessage.bind(this);
//       this.workers.push(worker);
//     }
//   }

//   init(material, heightFunction, terrainType) {
//     this.material = material;
//     this.getHeightAt = heightFunction;
//     this.terrainType = terrainType;
//     console.log("ChunkManager changed to type:", this.terrainType);
//   }

//   // Triggers when the worker finished computing the heights of a chunk
//   onWorkerMessage = (e) => {
//     const { chunkX, chunkY, size, resolution, terrainType, heights, normals } = e.data;
//     const key = `${chunkX},${chunkY},${terrainType}`;
//     const chunk = new Chunk({ x: chunkX, y: chunkY }, size, resolution, heights, normals, this.material);
//     chunk.addTo(this.scene);

//     // remove the request
//     this.requested.delete(key);
//     // remove the previous LOD chunk if it exist
//     if (this.loaded.has(key)) {
//       this.loaded.get(key).chunk.removeFrom(this.scene);
//       this.loaded.delete(key);
//     }
//     // put new chunk in chunks
//     this.loaded.set(key, { chunk, resolution });
//     // console.log("number of loaded chunks:", this.loaded.size);
//   };

//   #getChunkCoordinates(x, z) {
//     const cx = Math.floor((x + this.size / 2) / this.size);
//     const cz = Math.floor((z + this.size / 2) / this.size);
//     return { cx, cz };
//   }

//   // Return the chunks that are within the radius around the camera chunk
//   // position as an array of [x, y, sqrDistance], sorted by sqrDistance
//   #getNeededWithinRadius(x, z, radius) {
//     const needed = [];
//     const { cx, cz } = this.#getChunkCoordinates(x, z);

//     for (let dx = -radius; dx <= radius; dx++) {
//       for (let dz = -radius; dz <= radius; dz++) {
//         let sqrDistance = dx * dx + dz * dz;
//         if (sqrDistance <= radius ** 2)
//           needed.push([cx + dx, cz + dz, sqrDistance]);
//       }
//     }
//     needed.sort((a, b) => a[2] - b[2]); // sort by distance to camera chunk
//     return needed;
//   }

//   // Returns the resolution based on the distance
//   #getChunkResolution(sqrDistance) {
//     if (sqrDistance <= chunkDepth.HIGH.depth ** 2) return chunkDepth.HIGH.res;
//     if (sqrDistance <= chunkDepth.MID.depth ** 2) return chunkDepth.MID.res;
//     return chunkDepth.LOW.res;
//   }

//   #requestChunk(chunkX, chunkY, resolution) {
//     const key = `${chunkX},${chunkY},${this.terrainType}`;
//     const worker = this.workers[this.workerIndex];
//     this.workerIndex = (this.workerIndex + 1) % this.workers.length;

//     worker.postMessage({
//       chunkX,
//       chunkY,
//       size: this.size,
//       resolution,
//       terrainType: this.terrainType
//     });
//     this.requested.set(key, { resolution });
//   }

//   // Remove chunks that are not needed anymore
//   #removeOldChunks(needed) {
//     // create a set from needed to be able to check by key
//     const neededKey = new Set();
//     for (const [chunkX, chunkY] of needed) {
//       neededKey.add(`${chunkX},${chunkY},${this.terrainType}`);
//     }

//     for (let key of this.loaded.keys()) {
//       if (!neededKey.has(key)) {
//         const chunk = this.loaded.get(key).chunk;
//         chunk.removeFrom(this.scene);
//         this.loaded.get(key)
//         this.loaded.delete(key);
//       }
//     }
//   }

//   update(position) {
//     let nRequest = this.requested.size;
//     let needed = this.#getNeededWithinRadius(position.x, position.z, chunkDepth.LOW.depth);

//     for (const [chunkX, chunkY, sqrDistance] of needed) {
//       if (nRequest > updateSize) break;
//       const resolution = this.#getChunkResolution(sqrDistance);
//       const key = `${chunkX},${chunkY},${this.terrainType}`;

//       if (!this.requested.has(key)          // Not requested
//         && (!this.loaded.has(key)         // ... and ( not loaded ...
//           || (this.loaded.get(key).resolution != resolution))) { // ... or need to change scale)
//         this.#requestChunk(chunkX, chunkY, resolution);
//         nRequest++;
//       }
//     }
//     this.#removeOldChunks(needed);
//   }

//   // disposeChunks() {
//   //   for (const chunk of this.loaded) {
//   //     chunk.removeFrom(this.scene)
//   //   }
//   // }

//   getChunkMesh(x, y) {
//     const { cx, cy } = this.#getChunkCoordinates(x, y);
//     const key = `${cx},${cy},${this.terrainType}`;

//     if (this.loaded.has(key)) {
//       return this.loaded.get(key).chunk.getMesh();
//     }
//     return null;
//   }

//   updateCurvature(camera) {
//     // Update the curvature shader effect
//     if (this.material.userData.update) {
//       this.material.userData.update(camera);
//     }
//   }
// }
