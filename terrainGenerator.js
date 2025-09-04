import * as THREE from "three";

import { perlin_get } from "./perlinNoise.js";


const size = 256;        // chunk size
const chunkDepth = 4;     // chunk render distance

// Load Textures
const loader = new THREE.TextureLoader();

const ground_color = loader.load('Ground054_1K-JPG/Ground054_1K-JPG_Color.jpg');
const ground_normal = loader.load('Ground054_1K-JPG/Ground054_1K-JPG_NormalGL.jpg');
const ground_roughness = loader.load('Ground054_1K-JPG/Ground054_1K-JPG_Roughness.jpg');
const ground_ambientOcclusion = loader.load('Ground054_1K-JPG/Ground054_1K-JPG_AmbientOcclusion.jpg');

    // wrap them
[ground_color, ground_normal, ground_roughness, ground_ambientOcclusion].forEach(tex => {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(size / 6, size / 6); 
});

// Create Material
const material = new THREE.MeshStandardMaterial({
    map: ground_color,
    normalMap: ground_normal,
    normalScale: new THREE.Vector2(1, 1),
    roughnessMap: ground_roughness,
    aoMap: ground_ambientOcclusion
});



export function getTerrainHeightAt(x, y) {
    let n1 = 0;
    let n2 = 0;
    let n3 = 0;

    let scale1 = 0.0005;     // lower frequency = larger features
    let amp1   = 15;        // higher amplitude = taller hills
    n1 = perlin_get(x * scale1, y * scale1) * amp1;

    let scale2 = 0.007;
    let amp2   = 10;      
    n2 = perlin_get(x * scale2, y * scale2) * amp2;

    let scale3 = 0.07;
    let amp3   = 3;
    n3 = perlin_get(x * scale3, y * scale3 / 2) * amp3;

    return n1**2 + n2**2 + n3;
}

function generateChunkGeometry(chunkX, chunkY, size, resolution) {
    const geometry = new THREE.PlaneGeometry(size, size, resolution, resolution);

    let vertices = geometry.attributes.position;
    for (let i = 0; i < vertices.count; i++) {
        let x = vertices.getX(i);
        let y = -vertices.getY(i);  // !!!! MINUS !!!!! to account for the rotation from the xz plane
        let h = getTerrainHeightAt(chunkX * size + x, chunkY * size + y);
        vertices.setZ(i, h); // displace vertex
    }
    geometry.computeVertexNormals();

    return (geometry);
}

export function createChunk(chunkX, chunkY, size, resolution) {

    const geometry = generateChunkGeometry(chunkX, chunkY, size, resolution);

    const mesh = new THREE.Mesh(geometry, material);

    return mesh;
}

// Level Of Detail
function createChunkLOD(chunkX, chunkY, size) {
    const lod = new THREE.LOD();

    const highRes = createChunk(chunkX, chunkY, size, 128);
    const midRes = createChunk(chunkX, chunkY, size, 64);
    const lowRes = createChunk(chunkX, chunkY, size, 32);

    lod.addLevel(highRes,0);
    lod.addLevel(midRes,512);
    lod.addLevel(lowRes,1024);

    // rotate and align LOD
    lod.rotation.x = -Math.PI / 2;
    lod.position.set(chunkX * size, 0, chunkY * size);

    return (lod);
}

const rendered = new Map(); // chunks that are already rendered

export function updateChunks(camera, scene) {


    let needed = new Set(); // chunks that needs to be rendered

    // determine the list of chunks that needs to be generated
        // get camera position in chunk coordinated
    let cx = Math.floor((camera.position.x + size / 2) / size);
    let cy = Math.floor((camera.position.z + size / 2) / size);

        // add all chunk coordinates in range to the set
    for (let x = -chunkDepth; x <= chunkDepth; x++) {
        for (let y = -chunkDepth; y <= chunkDepth; y++) {
            let key = `${cx + x}, ${cy + y}`;
            needed.add(key);

            if (!rendered.has(key)) {
                let mesh = createChunkLOD(cx + x, cy + y, size);
                scene.add(mesh);
                rendered.set(key, mesh);
            }
        }
    }

    // remove non needed chunks
    for (let key of rendered.keys()) {
        if (!needed.has(key)) {
            let mesh = rendered.get(key);
            scene.remove(mesh);
            rendered.delete(key);
        }
    }
}

//     // POINTS
//     const pointsMaterial = new THREE.PointsMaterial({
//     size: 0.1,              // point size in world units
//     color: 0xff0000         // red dots
//     });
//     const points = new THREE.Points(geometry, pointsMaterial);
