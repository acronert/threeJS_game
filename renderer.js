import * as THREE from "https://unpkg.com/three@0.179.1/build/three.module.js";
import { EffectComposer } from "https://unpkg.com/three@0.179.1/examples/jsm/postprocessing/EffectComposer.js?module";
import { RenderPass } from "https://unpkg.com/three@0.179.1/examples/jsm/postprocessing/RenderPass.js?module";
// import { AfterimagePass } from "https://unpkg.com/three@0.179.1/examples/jsm/postprocessing/AfterimagePass.js?module";
import { FilmPass } from "https://unpkg.com/three@0.164.1/examples/jsm/postprocessing/FilmPass.js?module";
import { OutputPass } from "https://unpkg.com/three@0.179.1/examples/jsm/postprocessing/OutputPass.js?module";

import { ShaderPass } from "https://unpkg.com/three@0.164.1/examples/jsm/postprocessing/ShaderPass.js?module";

export function createRenderer(scene, camera) {

    // Create Renderer
    const renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    return (renderer);
}


// Postprocessing
export function createComposer(renderer, scene, camera) {
    const composer = new EffectComposer( renderer );

    composer.addPass( new RenderPass( scene, camera ));

    // FilmPass: adds film grain
    const filmPass = new FilmPass(
        0.35, // noise intensity
        0.90, // scanline intensity
        4096,   // scanline count
        false  // grayscale (true = black & white)
    );
    composer.addPass( filmPass );

    // Chromatic Aberration
    const chromaPass = new ShaderPass(ChromaticAberrationShader);
    composer.addPass(chromaPass);

    const outputPass = new OutputPass();
    composer.addPass( outputPass );

    filmPass.enabled = true;

    return (composer);
}

const ChromaticAberrationShader = {
  uniforms: {
    "tDiffuse": { value: null },
    "amount": { value: 0.005 }, // intensity of the shift
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float amount;
    varying vec2 vUv;

    void main() {
      vec2 offset = amount * vec2(1.0, 0.0); // horizontal shift
      float r = texture2D(tDiffuse, vUv + offset).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - offset).b;
      gl_FragColor = vec4(r, g, b, 1.0);
    }
  `
};


// export function createRenderer() {
//     const renderer = new THREE.WebGLRenderer({antialias:true});
//     renderer.setSize(window.innerWidth, window.innerHeight);
//     document.body.appendChild(renderer.domElement);
//     renderer.shadowMap.enabled = true;
//     renderer.shadowMap.type = THREE.PCFSoftShadowMap;

//     return (renderer);
// }