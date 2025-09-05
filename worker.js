// function random_vector(ix, iy) {
//     // Hash function → repeatable pseudo-random angle
//     let seed = Math.sin(ix * 374761393 + iy * 668265263) * 43758.5453;
//     let angle = seed - Math.floor(seed); // 0..1
//     angle *= Math.PI * 2;
//     return { x: Math.cos(angle), y: Math.sin(angle) };
// }

function random_vector(ix, iy) {
    let n = Math.floor(ix) * 374761393 + Math.floor(iy) * 668265263;
    n = (n ^ (n >>> 13)) * 1274126177;
    const angle = (n & 0xFFFF) / 65536 * Math.PI * 2;
    return { x: Math.cos(angle), y: Math.sin(angle) };
}

function fade(t) {
    //smooth
    return t * t * t * (t * (t * 6 - 15) + 10);
}

    // linear interpolation
function lerp(a, b, t) {
    return a + t * (b - a);
}

function dotGridGradient(ix, iy, x, y) {
    // Distance vector
    let dx = x - ix;
    let dy = y - iy;

    // Gradient
    let grad = random_vector(ix, iy);
    // Dot product
    return dx * grad.x + dy * grad.y;
}

// return from -1 to 1
function perlin_get(x, y) {
    // Cell coordinates
    let x0 = Math.floor(x);
    let x1 = x0 + 1;
    let y0 = Math.floor(y);
    let y1 = y0 + 1;

    // Local coordinates inside cell
    let sx = x - x0;
    let sy = y - y0;

    // Dot products at 4 corners
    let n0 = dotGridGradient(x0, y0, x, y);
    let n1 = dotGridGradient(x1, y0, x, y);
    let ix0 = lerp(n0, n1, fade(sx));

    n0 = dotGridGradient(x0, y1, x, y);
    n1 = dotGridGradient(x1, y1, x, y);
    let ix1 = lerp(n0, n1, fade(sx));

    // Final interpolate between ix0 and ix1
    let value = lerp(ix0, ix1, fade(sy));

    return value;
}

function getTerrainHeightAt(x, y) {
    let o0 = perlin_get(x * 0.0005, y * 0.0003);

    let o1 = perlin_get(x * 0.005, y * 0.002);
    o1 = Math.pow(1 - Math.abs(o1), 3.0); // sharp ridge

    let o2 = perlin_get(x * 0.01, y * 0.004);
    o2 = Math.pow(1 - Math.abs(o2), 3.0); // sharp ridge

    let o3 = perlin_get(x * 0.03, y * 0.01); // fine ripples

    return o0 * 100 + o1 * 30 + o2 * 20 + o3 * 4;
}

// function getTerrainHeightAt(x, y) {
//     let n1 = 0;
//     let n2 = 0;
//     let n3 = 0;
//     let n4 = 0;

//     let scale1 = 0.0005;     // lower frequency = larger features
//     let amp1   = 10;        // higher amplitude = taller hills
//     n1 = perlin_get(x * scale1, y * scale1) * amp1;

//     let scale2 = 0.007;
//     let amp2   = 10;      
//     n2 = perlin_get(x * scale2, y * scale2) * amp2;

//     let scale3 = 0.07;
//     let amp3   = 3;
//     n3 = perlin_get(x * scale3, y * scale3 * 0.5) * amp3;

//     let scale4 = 0.03;
//     let amp4 = 3;
//     n4 = Math.abs(perlin_get(x * scale4, y * scale4 * 0.5)) * amp4;

//     return n1**3 + n2**2 + n3 + n4**2;
// }

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