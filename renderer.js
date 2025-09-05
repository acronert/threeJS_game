import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
// import { AfterimagePass } from "three/examples/jsm/postprocessing/AfterimagePass.js";
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { FilmPass } from "three/examples/jsm/postprocessing/FilmPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

export function createRenderer() {
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

    // Fog
    scene.fog = new THREE.FogExp2(0xe8e5d6, 0.002); 



    // // FilmPass: adds film grain
    // const filmPass = new FilmPass(
    //     0.65, // noise intensity
    //     0.25, // scanline intensity
    //     1024,   // scanline count
    //     false  // grayscale (true = black & white)
    // );
    // composer.addPass( filmPass );
    // filmPass.enabled = true;

    // // Chromatic Aberration (shader)
    // const chromaPass = new ShaderPass(ChromaticAberrationShader);
    // composer.addPass(chromaPass);

    const outputPass = new OutputPass();
    composer.addPass( outputPass );

    // FXAA
    const fxaaPass = new ShaderPass(FXAAShader);
    fxaaPass.material.uniforms['resolution'].value.x = 1 / window.innerWidth;
    fxaaPass.material.uniforms['resolution'].value.y = 1 / window.innerHeight;
    composer.addPass(fxaaPass);

    
    return (composer);
}



const ChromaticAberrationShader = {
  uniforms: {
    "tDiffuse": { value: null },
    "amount": { value: 0.006 }, // intensity of the shift
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
        vec2 center = vec2(0.5, 0.5);
        float dist = distance(vUv, center); // 0 at center, ~0.707 at corners
        vec2 offset = amount * dist * vec2(1.0, 0.0); // horizontal shift scaled by distance

        float r = texture2D(tDiffuse, vUv + offset).r;
        float g = texture2D(tDiffuse, vUv).g;
        float b = texture2D(tDiffuse, vUv - offset).b;

        gl_FragColor = vec4(r, g, b, 1.0);
}

  `
};
