import * as THREE from "three";

export function createFootprintMaterial() {
  // Load Textures
  const loader = new THREE.TextureLoader();

  const normal_left = loader.load('./assets/Footprint/foot_left_normal.jpg');
  const alpha_left = loader.load('./assets/Footprint/foot_left_alpha.jpg');
  const normal_right = loader.load('./assets/Footprint/foot_right_normal.jpg');
  const alpha_right = loader.load('./assets/Footprint/foot_right_alpha.jpg');

  [normal_left, alpha_left, normal_right, alpha_right].forEach(tex => {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.rotation = Math.PI / 2; // rotate the textures 90degrees...
    tex.center.set(0.5, 0.5);   // ... center on the middle
  });

  const left = new THREE.MeshStandardMaterial({
    map: null,
    alphaMap: alpha_left,
    normalMap: normal_left,
    normalScale: new THREE.Vector2(2, 2),
    transparent: true,
    depthTest: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4
  });

  const right = new THREE.MeshStandardMaterial({
    map: null,
    alphaMap: alpha_right,
    normalMap: normal_right,
    normalScale: new THREE.Vector2(2, 2),
    transparent: true,
    depthTest: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4
  });
  return { left, right }
}

export function createTiretrackMaterial() {
  // Load Textures
  const loader = new THREE.TextureLoader();

  const normal = loader.load('./assets/TireTracks001_1K-JPG/TireTracks001_1K-JPG_NormalGL.jpg');
  const alpha = loader.load('./assets/TireTracks001_1K-JPG/TireTracks001_1K-JPG_Alpha.jpg');

  [alpha, normal].forEach(tex => {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.rotation = Math.PI / 2; // rotate the textures 90degrees...
    tex.center.set(0.5, 0.5);   // ... center on the middle
  });

  const material = new THREE.MeshStandardMaterial({
    map: null,
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

export function createSnowMaterial(size = 32) {
  // Load Textures
  const loader = new THREE.TextureLoader();

  const color = loader.load('./assets/Snow005_1K-JPG/Snow005_1K-JPG_Color.jpg');
  const normal = loader.load('./assets/Snow005_1K-JPG/Snow005_1K-JPG_NormalGL.jpg');
  const roughness = loader.load('./assets/Snow005_1K-JPG/Snow005_1K-JPG_Roughness.jpg');
  // const ambientOcclusion = loader.load('./assets/Snow005_1K-JPG/Snow005_1K-JPG_AmbientOcclusion.jpg');

  [color, normal, roughness].forEach(tex => {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(size / 8, size / 8); // wrap (divide more for zoom in)
    tex.rotation = Math.PI / 2; // rotate the textures 90degrees...
    tex.center.set(0.5, 0.5);   // ... center on the middle
  });

  // Create Material
  const material = new THREE.MeshStandardMaterial({
    map: color,
    normalMap: normal,
    normalScale: new THREE.Vector2(1, 1),
    roughnessMap: roughness,
  });

  return material;
}

export function createSandMaterial(size = 32) {
  // Load Textures
  const loader = new THREE.TextureLoader();

  const color = loader.load('./assets/Ground055S_1K-JPG/Ground055S_1K-JPG_Color.jpg');
  const normal = loader.load('./assets/Ground055S_1K-JPG/Ground055S_1K-JPG_NormalGL.jpg');
  const roughness = loader.load('./assets/Ground055S_1K-JPG/Ground055S_1K-JPG_Roughness.jpg');
  const ambientOcclusion = loader.load('./assets/Ground055S_1K-JPG/Ground055S_1K-JPG_AmbientOcclusion.jpg');

  [color, normal, roughness, ambientOcclusion].forEach(tex => {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(size / 8, size / 8); // wrap (divide more for zoom in)
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
  });


  // CURVATURE
  material.onBeforeCompile = (shader) => {
    // Add new uniforms
    shader.uniforms.cameraPos = { value: new THREE.Vector3() };
    shader.uniforms.curvatureRadius = { value: 1000000.0 };

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

