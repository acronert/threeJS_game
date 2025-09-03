
const chunkSize = 20;
const resolution = 50; // vertices per axis

// Create a gradient grid for the Perlin noise generator
let gridSize = resolution + 1;
let grid = [];
for (let i = 0; i <= nodes; i++) {
    let row = [];
    for (let j = 0; j <= nodes; j++) {
        row.push(random_vector());
    }
    grid.push(row);
}

function generateChunk(chunkX, chunkY) {
    const geometry = new THREE.PlaneGeometry(chunkSize, chunkSize, resolution, resolution);

    // list of all vertices in the plane
    let vertices = geometry.attributes.position;

    for (let i = 0; i < vertices.count; i++) {
        let x = vertices.getX(i);
        let y = vertices.getX(i);
    
    
    }
}