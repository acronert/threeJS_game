import { Chunk } from "./Chunk.js";
import { createSandMaterial } from "./SandMaterial.js";

const chunkDepth = {
    LOW: {
        depth:  32,
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

export class ChunkManager {
    constructor(scene, camera, chunkSize) {
        this.camera = camera;
        this.scene = scene;
        this.chunkSize = chunkSize;

        this.material = createSandMaterial(chunkSize);
        this.chunks = new Map();
        
        // type: module for the worker to be able to import the perlin script
        // /!\ worker file path is relative to the page, not the script from which it is called /!\
        this.worker = new Worker("src/Worker.js", { type: "module" });
        this.worker.onmessage = this.onWorkerMessage.bind(this);
    }

    onWorkerMessage = (e) => {
        const { chunkX, chunkY, resolution, vertices } = e.data;
        const chunk = new Chunk( { x: chunkX, y: chunkY }, this.chunkSize, resolution, vertices, this.material);
        chunk.addTo(this.scene);

        // remove the previous LOD chunk if it exist
        const key = `${chunkX},${chunkY}`;
        let oldChunk = this.chunks.get(key);
        if (oldChunk && oldChunk.chunk) {
            oldChunk.chunk.removeFrom(this.scene);
            this.chunks.delete(key);
        }

        // put new chunk in chunks
        this.chunks.set(key, { chunk, resolution });
    };

    update() {
        let needed = new Map(); // chunks that needs to be rendered,  with their needed resolution
        let candidates = [];

        // get camera position in chunk coordinated
        let x0 = Math.floor((this.camera.position.x + this.chunkSize / 2) / this.chunkSize);
        let y0 = Math.floor((this.camera.position.z + this.chunkSize / 2) / this.chunkSize);
        
        // determine the list of chunks that needs to be generated
        for (let x = -chunkDepth.LOW.depth; x <= chunkDepth.LOW.depth; x++) {
            for (let y = -chunkDepth.LOW.depth; y <= chunkDepth.LOW.depth; y++) {
                let sqrDistance = x * x + y * y;
                candidates.push([x0 + x, y0 + y, sqrDistance]);
            }
        }

        // sort by distance to camera chunk
        candidates.sort((a, b) => a[2] - b[2]);

        // TODO : change priority of needed chunks:
        //  - chunks that are not rendered yet, in order of distance
        //  - then chunks in order of distance
        // + Maybe dont send too many requests at once in case the player goes fast
        //   sending maybe the top 20 request per update cycle would avoid the 
        //   late generation of chunks far behind, that are top of the list

        // request in closest-first order
        for (const [chunkX, chunkY, sqrDistance] of candidates) {
            let resolution = 0;

            // select resolution based on distance
            if (sqrDistance <= chunkDepth.HIGH.depth**2) {
                resolution = chunkDepth.HIGH.res;
            } else if (sqrDistance <= chunkDepth.MID.depth**2) {
                resolution = chunkDepth.MID.res;
            } else if (sqrDistance <= chunkDepth.LOW.depth**2) {
                resolution = chunkDepth.LOW.res;
            } else {
                continue;
            }
            
            // add the chunk coordinates to the needed set
            let key = `${chunkX},${chunkY}`;
            needed.set(key, resolution);    // set the chunk as needed, with its resolution
            
            // Check if the needed chunk doesnt already exist, with same resolution
            const existing = this.chunks.get(key);
            if (!existing) {        // the chunk doesnt exist -> request it AND set it as loading
                this.worker.postMessage({ chunkX, chunkY, size: this.chunkSize, resolution });
                this.chunks.set(key, { chunk: null, resolution}); // mark as loading
            } else if (existing.resolution != resolution) { // the chunk exist, but in a different resolution -> request it
                this.worker.postMessage({ chunkX, chunkY, size: this.chunkSize, resolution });
            }
        }

        // remove non needed chunks
        for (let key of this.chunks.keys()) {
            if (!needed.has(key)) {
                let entry = this.chunks.get(key);
                if (entry && entry.chunk) entry.chunk.removeFrom(this.scene);
                this.chunks.delete(key);
            }
        }
    }

    // dispose() {
    // }
}