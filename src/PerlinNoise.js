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
export function perlin_get(x, y) {
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

export function getNormalAt(x, y, resolution, heightFunction) {
    const normal = { x: 0, y: 0, z: 0 };

    const hL = heightFunction(x - resolution, y);
    const hR = heightFunction(x + resolution, y);
    const hD = heightFunction(x, y - resolution);
    const hU = heightFunction(x, y + resolution);
    
    const dx = (hR - hL) / (2 * resolution);
    const dy = (hU - hD) / (2 * resolution);

    // Gradient normal
    normal.x = -dx;
    normal.y = -dy;
    normal.z = 2.0;

    // Normalize
    const len = Math.sqrt(normal.x * normal.x
                        + normal.y * normal.y
                        + normal.z * normal.z);
    normal.x /= len;
    normal.y /= len;
    normal.z /= len;

    return normal;
}

// GenerateDunes
export function getDesertHeightAt(x, y) {
    let o0 = perlin_get(x * 0.01, y * 0.01);  // zones of high and low dunes
    o0 = o0 / 2 + 0.5;
    // o0 = 1;

    let o1 = perlin_get(x * 0.05, y * 0.02);
    o1 = Math.pow(1 - Math.abs(o1), 3.0); // sharp ridge

    let o2 = perlin_get(x * 0.1, y * 0.04);
    o2 = Math.pow(1 - Math.abs(o2), 3.0); // sharp ridge

    let o3 = perlin_get(x * 0.3, y * 0.1); // fine ripples

    return o0 * 2 * (o1 * 3 + o2 * 2 + o3 * 0.6);
}

export function getSnowHeightAt(x, y) {
    // Large-scale base terrain (wide valleys and ridges)
    let base = perlin_get(x * 0.008, y * 0.008); // very low frequency

    // Mid-frequency detail
    let mid = perlin_get(x * 0.02, y * 0.02);
    // High-frequency rocky detail
    let high = perlin_get(x * 0.05, y * 0.05);
    // Shape the base to exaggerate valleys (square to widen valleys, sharpen peaks)
    let shapedBase = Math.pow(Math.abs(base), 3.0) * Math.sign(base);

    // Combine
    let height = shapedBase * 200         // large mountain/valley forms
                + mid * 5               // medium hills
                + high * 2;              // fine rocky detail

    // Add slope to tilt the terrain
    height -= 0.3 * x;  

    return height;
}


// export function getSnowHeightAt(x, y) {
//     let o1 = perlin_get(x * 0.1, y * 0.1);
//     let o2 = perlin_get(x * 0.01, y * 0.01);
//     let o3 = perlin_get(x * 0.001, y * 0.001);

//     return o1 * 2 + o2 * 8 + o3 * 16 - 0.3 * x;
// }
