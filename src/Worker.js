import { getTerrainHeightAt } from "./PerlinNoise.js";

function generateChunkHeights(chunkX, chunkY, size, resolution) {
    const vertices = new Float32Array(resolution * resolution);
    for (let z = 0; z < resolution; z++) {
        for (let x = 0; x < resolution; x++) {
            const dx = (chunkX + z / (resolution - 1)) * size - size / 2;
            const dy = (chunkY + x / (resolution - 1)) * size - size / 2;
            vertices[x * resolution + z] = getTerrainHeightAt(dx, dy);
        }
    }
    return vertices;
}

function getWorldXZ(chunkX, chunkY, size, resolution, x, z) {
    const worldX = chunkX * size + (x / (resolution - 1)) * size - size / 2;
    const worldZ = chunkY * size + (z / (resolution - 1)) * size - size / 2;
    return [worldX, worldZ];
}

function generateNormals(chunkX, chunkY, size,resolution, heights) {
    const normals = new Float32Array(resolution * resolution * 3);

    // for (let z = 1; z < resolution - 1; z++) {
    //     for (let x = 1; x < resolution - 1; x++) {
    for (let z = 0; z < resolution; z++) {
        for (let x = 0; x < resolution; x++) {
            const i = z * resolution + x;

            let hL;
            let hR;
            let hD;
            let hU;


            if (x === 0) {
                const [wx, wz] = getWorldXZ(chunkX, chunkY, size, resolution, x - 1, z);
                hL = getTerrainHeightAt(wx, wz);
            } else {
                hL = heights[i - 1];
            }

            if (x === resolution - 1) {
                const [wx, wz] = getWorldXZ(chunkX, chunkY, size, resolution, x + 1, z);
                hR = getTerrainHeightAt(wx, wz);
            } else {
                hR = heights[i + 1];
            }

            if (z === 0) {
                const [wx, wz] = getWorldXZ(chunkX, chunkY, size, resolution, x, z - 1);
                hD = getTerrainHeightAt(wx, wz);
            } else {
                hD = heights[i - resolution];
            }

            if (z === resolution - 1) {
                const [wx, wz] = getWorldXZ(chunkX, chunkY, size, resolution, x, z + 1);
                hU = getTerrainHeightAt(wx, wz);
            } else {
                hU = heights[i + resolution];
            }



            // const hL = heights[i - 1];
            // const hR = heights[i + 1];
            // const hD = heights[i - resolution];
            // const hU = heights[i + resolution];

            const dx = hR - hL;
            const dz = hU - hD;

            let nx = -dx;
            let ny = 2.0;
            let nz = -dz;

            // normalize
            const len = Math.sqrt(nx*nx + ny*ny + nz*nz);
            nx /= len;
            ny /= len;
            nz /= len;

            normals[i*3] = nx;
            normals[i*3 + 1] = ny;
            normals[i*3 + 2] = nz;
        }
    }

    return normals;
}

onmessage = (e) => {
    const { chunkX, chunkY, size, resolution } = e.data; // unpack input
    const vertices = generateChunkHeights(chunkX, chunkY, size, resolution);
    postMessage({ chunkX, chunkY, resolution, vertices }, [vertices.buffer]); // [list] is uses to transfert ownership of the data
    // const normals = generateNormals(chunkX, chunkY, size,resolution, vertices);
    // postMessage({ chunkX, chunkY, resolution, vertices, normals }, [vertices.buffer, normals.buffer]); // [list] is uses to transfert ownership of the data
}