import { getTerrainHeightAt } from "./PerlinNoise.js";

function generateChunkHeights(chunkX, chunkY, size, resolution) {
    const data = new Float32Array(resolution * resolution);
    for (let i = 0; i < resolution; i++) {
        for (let j = 0; j < resolution; j++) {
            const x = (chunkX + i / (resolution - 1)) * size - size / 2;
            const y = (chunkY + j / (resolution - 1)) * size - size / 2;
            data[j * resolution + i] = getTerrainHeightAt(x, y);
        }
    }
    return data;
}

onmessage = (e) => {
    const { chunkX, chunkY, size, resolution } = e.data; // unpack input
    const vertices = generateChunkHeights(chunkX, chunkY, size, resolution);
    postMessage({ chunkX, chunkY, resolution, vertices }, [vertices.buffer]); // [list] is uses to transfert ownership of the data
}