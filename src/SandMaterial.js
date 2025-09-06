import * as THREE from "three";

export function createSandMaterial(size) {
    // Load Textures
    const loader = new THREE.TextureLoader();
    
    const color = loader.load('../assets/Ground055S_1K-JPG/Ground055S_1K-JPG_Color.jpg');
    const normal = loader.load('../assets/Ground055S_1K-JPG/Ground055S_1K-JPG_NormalGL.jpg');
    const roughness = loader.load('../assets/Ground055S_1K-JPG/Ground055S_1K-JPG_Roughness.jpg');
    const ambientOcclusion = loader.load('../assets/Ground055S_1K-JPG/Ground055S_1K-JPG_AmbientOcclusion.jpg');
    const displacement = loader.load('../assets/Ground055S_1K-JPG/Ground055S_1K-JPG_Displacement.jpg');
    
    [color, normal, roughness, ambientOcclusion, displacement].forEach(tex => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(size / 64, size / 64); // wrap (divide more for zoom in)
        tex.rotation = Math.PI / 2; // rotate the textures 90degrees...
        tex.center.set(0.5, 0.5);   // ... center on the middle
    });
    
    // Create Material
    const material = new THREE.MeshStandardMaterial({
        map: color,
        normalMap: normal,
        normalScale: new THREE.Vector2(1, 1),
        roughnessMap: roughness,
        aoMap: ambientOcclusion,
        displacementMap: displacement,
        displacementScale: 0.3
    });

    return material;
}