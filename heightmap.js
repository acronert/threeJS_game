import * as THREE from "https://unpkg.com/three@0.179.1/build/three.module.js";

// export function createTerrainMesh() {
//     const geometry = new THREE.PlaneGeometry(100, 100, 256, 256); // width, height, width segments, height segments
//     geometry.rotateX(-Math.PI / 2);

//     const textureLoader = new THREE.TextureLoader();
//     const heightMap = textureLoader.load("heightmap.png");

    // const material = new THREE.MeshStandardMaterial({
    //     color: 0x00aa00,
    //     side: THREE.DoubleSide,
    //     displacementMap: heightMap,
    //     displacementScale: 5,
    // });
//     const mesh = new THREE.Mesh(geometry, material);
//     mesh.castShadow = true;
//     mesh.receiveShadow = true;

//     return (mesh);
// }

export function createTerrainMesh() {
    const geometry = new THREE.PlaneGeometry(100, 100, 256, 256);
    geometry.rotateX(-Math.PI / 2);

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load("heightmap.png", (texture) => {
    const canvas = document.createElement("canvas");
    canvas.width = texture.image.width;
    canvas.height = texture.image.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(texture.image, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        const x = i % (256+1);
        const z = Math.floor(i / (256+1));
        const px = Math.floor(x / 256 * canvas.width);
        const pz = Math.floor(z / 256 * canvas.height);
        const index = (pz * canvas.width + px) * 4;
        const h = data[index] / 255; // use red channel
        pos.setY(i, h * 5); // same as displacementScale
    }
    pos.needsUpdate = true;
    });

    const material = new THREE.MeshStandardMaterial({
        color: 0x00aa00,
        side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return (mesh);
}


