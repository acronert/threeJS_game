import { Chunk } from "./Chunk.js";
import { createSandMaterial } from "./SandMaterial.js";

export class ChunkManager {
    constructor(scene, camera, chunkSize, chunkDepth) {
        this.camera = camera;
        this.scene = scene;
        this.chunkSize = chunkSize;
        this.chunkDepth = chunkDepth;

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
        this.chunks.set(`${chunkX}, ${chunkY}`, chunk);
    };

    update() {
        let needed = new Set(); // chunks that needs to be rendered
        let candidates = [];

        // get camera position in chunk coordinated
        let x0 = Math.floor((this.camera.position.x + this.chunkSize / 2) / this.chunkSize);
        let y0 = Math.floor((this.camera.position.z + this.chunkSize / 2) / this.chunkSize);
        
        // determine the list of chunks that needs to be generated
        for (let x = -this.chunkDepth; x <= this.chunkDepth; x++) {
            for (let y = -this.chunkDepth; y <= this.chunkDepth; y++) {
                candidates.push([x0 + x, y0 + y]);
            }
        }

        // sort by distance to camera chunk
        candidates.sort((a, b) => {
            const da = (a[0] - x0) ** 2 + (a[1] - y0) ** 2;
            const db = (b[0] - x0) ** 2 + (b[1] - y0) ** 2;
            return da - db;
        });

        // request in closest-first order
        for (const [chunkX, chunkY] of candidates) {
            let key = `${chunkX}, ${chunkY}`;
            needed.add(key);

            if (!this.chunks.has(key)) {
                let resolution = 128;
                this.worker.postMessage({ chunkX, chunkY, size: this.chunkSize, resolution });
                this.chunks.set(key, null); // mark as loading
            }
        }

        // remove non needed chunks
        for (let key of this.chunks.keys()) {
            if (!needed.has(key)) {
                let chunk = this.chunks.get(key);
                if (chunk) chunk.removeFrom(this.scene);
                this.chunks.delete(key);
            }
        }
    }

    // dispose() {
    // }
}