import * as THREE from "three";

export function createFootprintMaterial(size = 1) {
    // Load Textures
    const loader = new THREE.TextureLoader();
    
    const color = loader.load('./assets/Footprint/Foot_color.jpg');

    const normal_left = loader.load('./assets/Footprint/Foot_left_normal.jpg');
    const alpha_left = loader.load('./assets/Footprint/Foot_left_alpha.jpg');
    
    [color, normal_left, alpha_left].forEach(tex => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.rotation = Math.PI / 2; // rotate the textures 90degrees...
        tex.center.set(0.5, 0.5);   // ... center on the middle
    });

    const left = new THREE.MeshStandardMaterial({
        map: color,
        alphaMap: alpha_left,
        normalMap: normal_left,
        transparent: true,
        depthTest: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -4
    });

    const normal_right = loader.load('./assets/Footprint/Foot_right_normal.jpg');
    const alpha_right = loader.load('./assets/Footprint/Foot_right_alpha.jpg');
    
    [color, normal_right, alpha_right].forEach(tex => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.rotation = Math.PI / 2; // rotate the textures 90degrees...
        tex.center.set(0.5, 0.5);   // ... center on the middle
    });

    const right = new THREE.MeshStandardMaterial({
        map: color,
        alphaMap: alpha_right,
        normalMap: normal_right,
        transparent: true,
        depthTest: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -4
    });

    return { left, right };
}