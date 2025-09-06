import * as THREE from "three";

const size = 256;        // chunk size
const chunkDepth = 3;     // chunk render distance

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


// Inject custom shader
material.onBeforeCompile = (shader) => {
    shader.uniforms.chunkPos = { value: new THREE.Vector2(0, 0) };
    shader.uniforms.chunkSize = { value: 128 };
    material.userData.shader = shader;

    // perlin functions
    shader.vertexShader = `
        uniform vec2 resolution;
        uniform vec2 chunkPos;
        uniform float chunkSize;

        vec2 random_vector(float ix, float iy) {
            int n = int(ix) * 374761393 + int(iy) * 668265263;
            n = (n ^ (n >> 13)) * 1274126177;
            float angle = float(n & 0xFFFF) / 65536.0 * 6.2831853;
            return vec2(cos(angle), sin(angle));
        }

        // Fade curve
        float fade(float t) {
            return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
        }

        // Linear interpolation
        float lerp(float a, float b, float t) {
            return a + t * (b - a);
        }

        // Dot product of gradient with distance vector
        float dotGridGradient(float ix, float iy, float x, float y) {
            vec2 grad = random_vector(ix, iy);
            float dx = x - ix;
            float dy = y - iy;
            return dx * grad.x + dy * grad.y;
        }

        // Final Perlin noise function, returns -1..1
        float perlin_get(float x, float y) {
            // Cell coordinates
            float x0 = floor(x);
            float x1 = x0 + 1.0;
            float y0 = floor(y);
            float y1 = y0 + 1.0;

            // Local coords inside cell
            float sx = x - x0;
            float sy = y - y0;

            // Dot products
            float n0 = dotGridGradient(x0, y0, x, y);
            float n1 = dotGridGradient(x1, y0, x, y);
            float ix0 = lerp(n0, n1, fade(sx));

            n0 = dotGridGradient(x0, y1, x, y);
            n1 = dotGridGradient(x1, y1, x, y);
            float ix1 = lerp(n0, n1, fade(sx));

            return lerp(ix0, ix1, fade(sy));
        }

        float getTerrainHeightAt(float x, float y) {
            float scale = 0.01;

            float n = perlin_get(x * scale, y * scale);

            return n;
            // return n * 0.5 + 0.5; // remap on 0 -> 1
        }
    ` + shader.vertexShader;

    // inject main
    shader.vertexShader = shader.vertexShader.replace(
        `#include <begin_vertex>`,
        `
        #include <begin_vertex>
        vec2 worldPos = (uv + chunkPos) * chunkSize;
        transformed.z = getTerrainHeightAt(worldPos.x, worldPos.y) * 50.0;
        `
    );
};

function createChunk(chunkX, chunkY, size) {
    const geometry = new THREE.PlaneGeometry(size, size, 128, 128);
    const mesh = new THREE.Mesh(geometry, material)

    // rotate and align
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(chunkX * size, 0, chunkY * size);

    // per-chunk uniform update
    mesh.onBeforeRender = (renderer, scene, camera, geometry, material) => {
        const shader = material.userData.shader;
        if (!shader) return;
        shader.uniforms.chunkPos.value.set(chunkX * size, chunkY * size);
        shader.uniforms.chunkSize.value = size;
    };

    return (mesh);
}



const rendered = new Map(); // chunks that are already rendered

export function updateChunks(camera, scene) {
    let needed = new Set();
    // determine the list of chunks that needs to be generated
    let cx = Math.floor((camera.position.x + size / 2) / size);
    let cy = Math.floor((camera.position.z + size / 2) / size);
        // add all chunk coordinates in range to the set
    for (let x = -chunkDepth; x <= chunkDepth; x++) {
        for (let y = -chunkDepth; y <= chunkDepth; y++) {
            let key = `${cx + x}, ${cy + y}`;
            needed.add(key);

            if (!rendered.has(key)) {
                let mesh = createChunk(cx + x, cy + y, size);
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
