const nodes = 4; // number of gradients along each axis
let grid = [];

// Generate gradient vectors
for (let i = 0; i <= nodes; i++) {
    let row = [];
    for (let j = 0; j <= nodes; j++) {
        row.push(random_vector());
    }
    grid.push(row);
}

function random_vector() {
    let angle = Math.random() * 2 * Math.PI;
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
    let grad = grid[iy][ix];

    // Dot product
    return dx * grad.x + dy * grad.y;
}

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
