import { Chunk } from "./Chunk.js";
import { createSandMaterial } from "./SandMaterial.js";

// For each Level Of Details (LOD), set the chunk distance and resolution
// const chunkDepth = {
//     LOW: {
//         depth:  16,
//         res:    16,
//     },
//     MID: {
//         depth:  8,
//         res:    64,
//     },
//     HIGH: {
//         depth:  4,
//         res:    128
//     }
// }

const chunkDepth = {
    LOW: {
        depth:  12,
        res:    16,
    },
    MID: {
        depth:  6,
        res:    64,
    },
    HIGH: {
        depth:  3,
        res:    128
    }
}

// Number of chunks that are requested each time update() is triggered
const updateSize = 40;

export class ChunkManager {
    constructor(scene, camera, chunkSize) {
        this.camera = camera;
        this.scene = scene;
        this.chunkSize = chunkSize;

        this.sandMaterial = createSandMaterial(chunkSize);
        this.loaded = new Map();
        this.requested = new Map();
        
        // Multiple workers
        this.workers = [];
        this.workerIndex = 0;
        // number of workers = number of CPU cores / 2
        const workerCount = Math.max(1, Math.floor(navigator.hardwareConcurrency / 2));
    
        // init the workers
        for (let i = 0; i < workerCount; i++) {
            const worker = new Worker("src/Worker.js", { type: "module" });
            worker.onmessage = this.onWorkerMessage.bind(this);
            this.workers.push(worker);
        }
    }

    // Triggers when the worker finished computing the heights of a chunk
    onWorkerMessage = (e) => {
        const { chunkX, chunkY, resolution, heights, normals } = e.data;
        const key = `${chunkX},${chunkY}`;
        const chunk = new Chunk( { x: chunkX, y: chunkY }, this.chunkSize, resolution, heights, normals, this.sandMaterial);
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
                if (sqrDistance <= radius**2)
                needed.push([cx + x, cy + y, sqrDistance]);
            }
        }
        needed.sort((a, b) => a[2] - b[2]); // sort by distance to camera chunk
        return needed;
    }

    // Returns the resolution based on the distance
    #getChunkResolution(sqrDistance) {
        if (sqrDistance <= chunkDepth.HIGH.depth**2) return chunkDepth.HIGH.res;
        if (sqrDistance <= chunkDepth.MID.depth**2) return chunkDepth.MID.res;
        return chunkDepth.LOW.res;
    }

    #requestChunk(chunkX, chunkY, resolution) {
        const key = `${chunkX},${chunkY}`;
        const worker = this.workers[this.workerIndex];
        this.workerIndex = (this.workerIndex + 1) % this.workers.length;
        worker.postMessage({ chunkX, chunkY, size: this.chunkSize, resolution });
        this.requested.set(key, { resolution });
    }

    // Remove chunks that are not needed anymore
    #removeOldChunks(needed) {
        // create a set from needed to be able to check by key
        const neededKey = new Set();
        for (const [chunkX, chunkY] of needed) {
            neededKey.add(`${chunkX},${chunkY}`);
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
            if (nRequest > updateSize)  break;
            const resolution = this.#getChunkResolution(sqrDistance);

            if (!this.requested.has(`${chunkX},${chunkY}`)          // Not requested
                && (!this.loaded.has(`${chunkX},${chunkY}`)         // ... and ( not loaded ...
                || (this.loaded.get(`${chunkX},${chunkY}`).resolution != resolution))) { // ... or need to change scale)
                    this.#requestChunk(chunkX, chunkY, resolution);
                    nRequest++;
            }
        }
        this.#removeOldChunks(needed);
    }

    // dispose() {
    // }

    getChunkMesh(x, y) {
        const { cx, cy } = this.#getChunkCoordinates(x, y);
        const key = `${cx},${cy}`;

        if (this.loaded.has(key)) {
            return this.loaded.get(key).chunk.getMesh();
        }
        return null;
    }

    updateMaterial(camera) {
    // Update the curvature shader effect
        if (this.sandMaterial.userData.update) {
            this.sandMaterial.userData.update(camera);
        }
    }
}
