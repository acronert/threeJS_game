import * as THREE from "three";

export function createTiretracksMaterial(size = 1) {
    // Load Textures
    const loader = new THREE.TextureLoader();
    
    const color = loader.load('./assets/TireTracks001_1K-JPG/foot_color.jpg');

    const normal = loader.load('./assets/TireTracks001_1K-JPG/TireTracks001_1K-JPG_NormalGL.jpg');
    const alpha = loader.load('./assets/TireTracks001_1K-JPG/TireTracks001_1K-JPG_Alpha2.jpg');
    
    [color, normal].forEach(tex => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(0.5, 1);
        tex.rotation = Math.PI / 2; // rotate the textures 90degrees...
        tex.center.set(0.5, 0.5);   // ... center on the middle
    });

    const material = new THREE.MeshStandardMaterial({
        map: color,
        alphaMap: alpha,
        normalMap: normal,
        normalScale: new THREE.Vector2(4, 4),
        transparent: true,
        depthTest: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -4
    });

    return material;
}