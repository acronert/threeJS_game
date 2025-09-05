
import * as THREE from "three";


export function createChunkGenerator(scene, camera) {
    const size = 128;        // chunk size
    const chunkDepth = 8;     // chunk render distance
    
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


    const worker = new Worker("worker.js");
    const rendered = new Map(); // chunks that are already rendered

    worker.onmessage = (e) => {
        const { chunkX, chunkY, resolution, vertices } = e.data;
        const geometry = new THREE.PlaneGeometry(size, size, resolution - 1, resolution - 1);

        const positions = geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            positions.setZ(i, vertices[i]); // set z to terrain height
        }
        positions.needsUpdate = true;
        geometry.computeVertexNormals();
        const mesh = new THREE.Mesh(geometry, material);

        // rotate and align
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(chunkX * size, 0, chunkY * size);
        
        scene.add(mesh);
        rendered.set(`${chunkX}, ${chunkY}`, mesh);
        console.log("received ", chunkX, chunkY);

    };

    
    function update() {
        let needed = new Set(); // chunks that needs to be rendered
        let candidates = [];

        // get camera position in chunk coordinated
        let cx = Math.floor((camera.position.x + size / 2) / size);
        let cy = Math.floor((camera.position.z + size / 2) / size);
        
        // determine the list of chunks that needs to be generated
        for (let x = -chunkDepth; x <= chunkDepth; x++) {
            for (let y = -chunkDepth; y <= chunkDepth; y++) {
                candidates.push([cx + x, cy + y]);
            }
        }

        // sort by distance to camera chunk
        candidates.sort((a, b) => {
            const da = (a[0] - cx) ** 2 + (a[1] - cy) ** 2;
            const db = (b[0] - cx) ** 2 + (b[1] - cy) ** 2;
            return da - db;
        });

        // request in closest-first order
        for (const [chunkX, chunkY] of candidates) {
            let key = `${chunkX}, ${chunkY}`;
            needed.add(key);

            if (!rendered.has(key)) {
                let resolution = 128;
                worker.postMessage({ chunkX, chunkY, size, resolution });
                console.log("request ", chunkX, chunkY);
                rendered.set(key, null); // mark as loading
            }
        }

        // remove non needed chunks
        for (let key of rendered.keys()) {
            if (!needed.has(key)) {
                let mesh = rendered.get(key);
                scene.remove(mesh);
                mesh.geometry.dispose()
                rendered.delete(key);
            }
        }
    }

    return { update };
}







// import * as THREE from "three";

// import { getTerrainHeightAt } from "./perlinNoise.js";


// export function createChunkGenerator(scene, camera) {
//     const size = 256;        // chunk size
//     const chunkDepth = 8;     // chunk render distance
    
//     // Load Textures
//     const loader = new THREE.TextureLoader();
    
//     const ground_color = loader.load('Ground054_1K-JPG/Ground054_1K-JPG_Color.jpg');
//     const ground_normal = loader.load('Ground054_1K-JPG/Ground054_1K-JPG_NormalGL.jpg');
//     const ground_roughness = loader.load('Ground054_1K-JPG/Ground054_1K-JPG_Roughness.jpg');
//     const ground_ambientOcclusion = loader.load('Ground054_1K-JPG/Ground054_1K-JPG_AmbientOcclusion.jpg');
    
//         // wrap them
//     [ground_color, ground_normal, ground_roughness, ground_ambientOcclusion].forEach(tex => {
//         tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
//         tex.repeat.set(size / 6, size / 6); 
//     });
    
//     // Create Material
//     const material = new THREE.MeshStandardMaterial({
//         map: ground_color,
//         normalMap: ground_normal,
//         normalScale: new THREE.Vector2(1, 1),
//         roughnessMap: ground_roughness,
//         aoMap: ground_ambientOcclusion
//     });

//     function generateChunkGeometry(chunkX, chunkY, size, resolution) {
//         const geometry = new THREE.PlaneGeometry(size, size, resolution, resolution);

//         let vertices = geometry.attributes.position;
//         for (let i = 0; i < vertices.count; i++) {
//             let x = vertices.getX(i);
//             let y = -vertices.getY(i);  // !!!! MINUS !!!!! to account for the rotation from the xz plane
//             let h = getTerrainHeightAt(chunkX * size + x, chunkY * size + y);
//             vertices.setZ(i, h); // displace vertex
//         }
//         geometry.computeVertexNormals();

//         return (geometry);
//     }

//     function createChunk(chunkX, chunkY, size, resolution) {
//         const geometry = generateChunkGeometry(chunkX, chunkY, size, resolution);
//         const mesh = new THREE.Mesh(geometry, material);

//         return mesh;
//     }

//     // Level Of Detail
//     function createChunkLOD(chunkX, chunkY, size) {
//         const lod = new THREE.LOD();

//         const highRes = createChunk(chunkX, chunkY, size, 128);
//         const midRes = createChunk(chunkX, chunkY, size, 64);
//         const lowRes = createChunk(chunkX, chunkY, size, 32);

//         lod.addLevel(highRes,0);
//         lod.addLevel(midRes,512);
//         lod.addLevel(lowRes,1024);

//         // rotate and align LOD
//         lod.rotation.x = -Math.PI / 2;
//         lod.position.set(chunkX * size, 0, chunkY * size);

//         return (lod);
//     }

//     const rendered = new Map(); // chunks that are already rendered

//     function update() {
//         let needed = new Set(); // chunks that needs to be rendered

//         // determine the list of chunks that needs to be generated
//             // get camera position in chunk coordinated
//         let cx = Math.floor((camera.position.x + size / 2) / size);
//         let cy = Math.floor((camera.position.z + size / 2) / size);

//             // add all chunk coordinates in range to the set
//         for (let x = -chunkDepth; x <= chunkDepth; x++) {
//             for (let y = -chunkDepth; y <= chunkDepth; y++) {
//                 let key = `${cx + x}, ${cy + y}`;
//                 needed.add(key);

//                 if (!rendered.has(key)) {
//                     let mesh = createChunkLOD(cx + x, cy + y, size);
//                     scene.add(mesh);
//                     rendered.set(key, mesh);
//                 }
//             }
//         }

//         // remove non needed chunks
//         for (let key of rendered.keys()) {
//             if (!needed.has(key)) {
//                 let mesh = rendered.get(key);
//                 scene.remove(mesh);
//                 rendered.delete(key);
//             }
//         }
//     }

//     return { update };
// }




