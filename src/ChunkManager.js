import { Chunk } from "./Chunk.js";
import { createSandMaterial } from "./SandMaterial.js";

// For each Level Of Details (LOD), set the chunk distance and resolution
const chunkDepth = {
    LOW: {
        depth:  16,
        res:    16,
    },
    MID: {
        depth:  8,
        res:    64,
    },
    HIGH: {
        depth:  4,
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

        this.material = createSandMaterial(chunkSize);
        this.loaded = new Map();
        this.requested = new Map();
        
        // // type: module for the worker to be able to import the perlin script
        // // /!\ worker file path is relative to the page, not the script from which it is called /!\
        // this.worker = new Worker("src/Worker.js", { type: "module" });
        // this.worker.onmessage = this.onWorkerMessage.bind(this);

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

        const chunk = new Chunk( { x: chunkX, y: chunkY }, this.chunkSize, resolution, heights, normals, this.material);
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

    // // Triggers when the worker finished computing the heights of a chunk
    // onWorkerMessage = (e) => {
    //     const { chunkX, chunkY, resolution, vertices } = e.data;
    //     const key = `${chunkX},${chunkY}`;

    //     const chunk = new Chunk( { x: chunkX, y: chunkY }, this.chunkSize, resolution, vertices, this.material);
    //     chunk.addTo(this.scene);

    //     // remove the request
    //     this.requested.delete(key);

    //     // remove the previous LOD chunk if it exist
    //     if (this.loaded.has(key)) {
    //         this.loaded.get(key).chunk.removeFrom(this.scene);
    //         this.loaded.delete(key);
    //     }
    //     // put new chunk in chunks
    //     this.loaded.set(key, { chunk, resolution });
    // };

    // Return the chunks that are within the radius around the camera chunk
    // position as an array of [x, y, sqrDistance], sorted by sqrDistance
    getNeededWithinRadius(radius) {
        const needed = [];
        // get camera position in chunk coordinated
        let x0 = Math.floor((this.camera.position.x + this.chunkSize / 2) / this.chunkSize);
        let y0 = Math.floor((this.camera.position.z + this.chunkSize / 2) / this.chunkSize);
        
        for (let x = -radius; x <= radius; x++) {
            for (let y = -radius; y <= radius; y++) {
                let sqrDistance = x * x + y * y;
                if (sqrDistance <= radius**2)
                needed.push([x0 + x, y0 + y, sqrDistance]);
            }
        }
        // sort by distance to camera chunk
        needed.sort((a, b) => a[2] - b[2]);

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

    // #requestChunk(chunkX, chunkY, resolution) {
    //     const key = `${chunkX},${chunkY}`;
    //     this.worker.postMessage({ chunkX, chunkY, size: this.chunkSize, resolution });
    //     this.requested.set(key, { resolution });
    // }

    // Remove chunks that are not needed anymore
    #removeOldChunks(needed) {
        // create a set from needed to be able to check by key
        const neededKey = new Set();
        for (const [chunkX, chunkY] of needed) {
            neededKey.add(`${chunkX},${chunkY}`);
        }

        for (let key of this.loaded.keys()) {
            if (!neededKey.has(key)) {
                this.loaded.get(key).chunk.removeFrom(this.scene);
                this.loaded.delete(key);
            }
        }
    }

    update() {
        let nRequest = this.requested.size;
        let needed = this.getNeededWithinRadius(chunkDepth.LOW.depth);

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

    updateMaterial(camera) {
        if (this.material.userData.update) {
            this.material.userData.update(camera);
        }
    }
}
