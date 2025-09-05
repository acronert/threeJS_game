import * as THREE from "https://unpkg.com/three@0.179.1/build/three.module.js";
import { createRenderer } from "./renderer.js";
import { createComposer } from "./renderer.js";
import { createInputManager } from "./inputManager.js";
import { createControls } from "./controls.js";

import { createTextureRoom, updateRoom } from "./createTextureRoom.js";
import { createSkybox } from "./skybox.js";

// import { createChunk } from "./terrainGenerator.js";
import { createChunkGenerator } from "./terrainGenerator.js";
// import { updateChunks } from "./heightMap.js";

// Scene
const scene = new THREE.Scene();

// const room = createTextureRoom();
// scene.add(room);

createSkybox(scene);

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 4096);
camera.position.set(0, 10, 0);

// Renderer
const renderer = createRenderer();
const composer = createComposer(renderer, scene, camera);

// ChunkGenerator
const chunkGenerator = createChunkGenerator(scene, camera);

// Fullscreen
function requestFullscreen() {
  const el = document.body; // or renderer.domElement
  if (el.requestFullscreen) {
    el.requestFullscreen();
  } else if (el.webkitRequestFullscreen) { // Safari / iOS
    el.webkitRequestFullscreen();
  } else if (el.msRequestFullscreen) { // old IE/Edge
    el.msRequestFullscreen();
  }
}

// Toggle fullscreen
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    requestFullscreen();
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }
}

// Enter fullscreen on first touch or click
document.addEventListener("touchstart", toggleFullscreen, { once: true });
document.addEventListener("mousedown", toggleFullscreen, { once: true });


// Controls
const input = createInputManager(renderer.domElement);
const controls = createControls(camera, input);

const interval = setInterval(() => {
    chunkGenerator.update();
}, 500);

// Animation
function animate() {
    requestAnimationFrame(animate);
    controls.update();

    // updateRoom();
    composer.render();
}
animate();

function updateFOV() {
  if (window.innerWidth > window.innerHeight) {
    // Landscape
    camera.fov = 60;
  } else {
    // Portrait
    camera.fov = 80;
  }
  camera.updateProjectionMatrix();
}

// Responsive resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth/window.innerHeight;
  updateFOV();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

