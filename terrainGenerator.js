import * as THREE from "three";

import { perlin_get } from "./perlinNoise.js";



// export function getTerrainHeightAt(x, y) {
//     const scale = 0.05;      // high for lots of peaks, low for smooth
//     const amplitude = 10;    // peaks height
//     return (perlin_get(x * scale, y * scale) * amplitude);
// }

export function getTerrainHeightAt(x, y) {
    let n1 = 0;
    let n2 = 0;
    let n3 = 0;

    let scale1 = 0.007;     // lower frequency = larger features
    let amp1   = 10;        // higher amplitude = taller hills
    n1 = perlin_get(x * scale1, y * scale1) * amp1;

    let scale2 = 0.1;
    let amp2   = 3;      
    n2 = perlin_get(x * scale2, y * scale2) * amp2;

    // let scale3 = 0.01;
    // let amp3   = 1;
    // n3 = perlin_get(x * scale3, y * scale3) * amp3;

    return n1**2 + n2 + n3;
}

function generateChunkGeometry(chunkX, chunkY, size, resolution) {
    const geometry = new THREE.PlaneGeometry(size, size, resolution, resolution);

    // list of all vertices in the plane
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
    // texture
    const loader = new THREE.TextureLoader();
    const ground_color = loader.load('Ground054_1K-JPG/Ground054_1K-JPG_Color.jpg');
    const ground_normal = loader.load('Ground054_1K-JPG/Ground054_1K-JPG_NormalGL.jpg');
    // const ground_displacement = loader.load('Ground054_1K-JPG/Ground054_1K-JPG_Displacement.jpg');
    const ground_roughness = loader.load('Ground054_1K-JPG/Ground054_1K-JPG_Roughness.jpg');
    const ground_ambientOcclusion = loader.load('Ground054_1K-JPG/Ground054_1K-JPG_AmbientOcclusion.jpg');
   
    [ground_color, ground_normal, ground_roughness, ground_ambientOcclusion].forEach(tex => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(size / 5, size / 5); 
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
    
    // rotate and align mesh
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(chunkX * size, 0, chunkY * size);

    return (mesh);
}

const rendered = new Map(); // chunks that are already rendered

export function updateChunks(camera, scene) {
    const size = 100;        // chunk size
    const resolution = 200;  // vertices per axis
    const distance = 3;     // chunk render distance

    let needed = new Set(); // chunks that needs to be rendered

    // determine the list of chunks that needs to be generated
        // get camera position in chunk coordinated
    let cx = Math.floor((camera.position.x + size / 2) / size);
    let cy = Math.floor((camera.position.z + size / 2) / size);

        // add all chunk coordinates in range to the set
    for (let x = -distance; x <= distance; x++) {
        for (let y = -distance; y <= distance; y++) {
            let key = `${cx + x}, ${cy + y}`;
            needed.add(key);

            if (!rendered.has(key)) {
                let mesh = createChunk(cx + x, cy + y, size, resolution);
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