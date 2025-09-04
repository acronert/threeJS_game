import * as THREE from "three";

import { perlin_get } from "./perlinNoise.js";

function generateChunkGeometry(chunkX, chunkY, size, resolution) {
    const geometry = new THREE.PlaneGeometry(size, size, resolution, resolution);

    // list of all vertices in the plane
    let vertices = geometry.attributes.position;
    let scale = 0.1;

    for (let i = 0; i < vertices.count; i++) {
        let x = vertices.getX(i);
        let y = vertices.getY(i);
        let perlinX = (chunkX * size + x) * scale;
        let perlinY = (-chunkY * size + y) * scale;
        let h = perlin_get(perlinX, perlinY) * 5; // between -1..1
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
    mesh.rotation.x = -Math.PI / 2;

    // align mesh
    // mesh.position.set(chunkX * size + size / 2, chunkY * size + size / 2, 0);
    mesh.position.set(chunkX * size + size / 2, 0, chunkY * size + size / 2);

    return (mesh);
}

const rendered = new Map(); // chunks that are already rendered

export function updateChunks(camera, scene) {
    const size = 20;        // chunk size
    const resolution = 25;  // vertices per axis
    const distance = 2;     // chunk render distance

    let needed = new Set(); // chunks that needs to be rendered

    // determine the list of chunks that needs to be generated
        // get camera position in chunk coordinated
    let cx = Math.floor(camera.position.x / size);
    let cy = Math.floor(camera.position.z / size);

        // add all chunk coordinates in range to the set
    for (let x = -distance; x <= distance; x++) {
        for (let y = -distance; y <= distance; y++) {
            let key = `${cx + x}, ${cy + y}`;
            needed.add(key);

            if (!rendered.has(key)) {
                // generate the chunk
                let mesh = createChunk(cx + x, cy + y, size, resolution);
                // align mesh
                // mesh.position.set((cx + x) * size + size / 2, 0, (cy + y) * size + size / 2);

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