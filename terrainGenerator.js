import * as THREE from "three";

const chunkSize = 20;
const resolution = 50; // vertices per axis


function random_vector(ix, iy) {
    // Hash function → repeatable pseudo-random angle
    let seed = Math.sin(ix * 374761393 + iy * 668265263) * 43758.5453;
    let angle = seed - Math.floor(seed); // 0..1
    angle *= Math.PI * 2;
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


export function generateChunk(chunkX, chunkY) {
    const geometry = new THREE.PlaneGeometry(chunkSize, chunkSize, resolution, resolution);

    // list of all vertices in the plane
    let vertices = geometry.attributes.position;
    let scale = 0.1;

    for (let i = 0; i < vertices.count; i++) {
        let x = vertices.getX(i);
        let y = vertices.getY(i);

        let perlinX = (chunkX * chunkSize + x) * scale;
        let perlinY = (chunkY * chunkSize + y) * scale;
    
        let h = perlin_get(perlinX, perlinY) * 2; // between -1..1

        vertices.setZ(i, h); // displace vertex
    }

    geometry.computeVertexNormals();

    // texture
    const loader = new THREE.TextureLoader();
    const ground_color = loader.load('Ground054_1K-JPG/Ground054_1K-JPG_Color.jpg');
    const ground_normal = loader.load('Ground054_1K-JPG/Ground054_1K-JPG_NormalGL.jpg');
    // const ground_displacement = loader.load('Ground054_1K-JPG/Ground054_1K-JPG_Displacement.jpg');
    const ground_roughness = loader.load('Ground054_1K-JPG/Ground054_1K-JPG_Roughness.jpg');
    const ground_ambientOcclusion = loader.load('Ground054_1K-JPG/Ground054_1K-JPG_AmbientOcclusion.jpg');
   
    [ground_color, ground_normal, ground_roughness, ground_ambientOcclusion].forEach(tex => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(chunkSize / 5, chunkSize / 5); 
    });

    const material = new THREE.MeshStandardMaterial({
        map: ground_color,
        normalMap: ground_normal,
        normalScale: new THREE.Vector2(1, 1),
        // displacementMap: ground_displacement,
        // displacementScale: 0.05,
        // displacementBias: 0,
        roughnessMap: ground_roughness,
        aoMap: ground_ambientOcclusion
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    return (mesh);
}