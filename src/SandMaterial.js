import * as THREE from "three";

export function createSandMaterial(size = 1) {
    // Load Textures
    const loader = new THREE.TextureLoader();
    
    const color = loader.load('./assets/Ground055S_1K-JPG/Ground055S_1K-JPG_Color.jpg');
    const normal = loader.load('./assets/Ground055S_1K-JPG/Ground055S_1K-JPG_NormalGL.jpg');
    const roughness = loader.load('./assets/Ground055S_1K-JPG/Ground055S_1K-JPG_Roughness.jpg');
    const ambientOcclusion = loader.load('./assets/Ground055S_1K-JPG/Ground055S_1K-JPG_AmbientOcclusion.jpg');
    // const displacement = loader.load('./assets/Ground055S_1K-JPG/Ground055S_1K-JPG_Displacement.jpg');
    
    [color, normal, roughness, ambientOcclusion].forEach(tex => {
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
        // displacementMap: displacement,
        // displacementScale: 0.3
    });


    material.onBeforeCompile = (shader) => {
        // CURVATURE
        // Add new uniforms
        shader.uniforms.cameraPos = { value: new THREE.Vector3() };
        shader.uniforms.curvatureRadius = { value: 40000.0 };

        // Declare uniforms in vertex shader
        shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `#include <common>
        uniform vec3 cameraPos;
        uniform float curvatureRadius;
        `
        );

        // Inject curvature effect in the vertex shader
        shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        
        // Apply curvature effect
        vec3 worldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
        vec2 offset = worldPos.xz - cameraPos.xz;
        float dist2 = dot(offset, offset);
        
        // Apply curvature by modifying the transformed position
        transformed.z -= dist2 / (2.0 * curvatureRadius);
        `
        );

        // Store update function
        material.userData.update = (camera) => {
        shader.uniforms.cameraPos.value.copy(camera.position);
        };
    };

    return material;
}



