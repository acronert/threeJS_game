import * as THREE from "https://unpkg.com/three@0.179.1/build/three.module.js";
import { createScene } from "./scene.js";
import { createCameraControls } from "./controls.js";
import { createGyroControls } from "./gyroControls.js";
import { createRenderer } from "./renderer.js";
import { createComposer } from "./renderer.js";

// Scene
const scene = new THREE.Scene();
scene.add(createScene());

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 0);

// Renderer
// const renderer = new THREE.WebGLRenderer({antialias:true});
// renderer.setSize(window.innerWidth, window.innerHeight);
// document.body.appendChild(renderer.domElement);
// renderer.shadowMap.enabled = true;
// renderer.shadowMap.type = THREE.PCFSoftShadowMap; // nice soft shadows
const renderer = createRenderer(scene, camera);

const composer = createComposer(renderer, scene, camera);

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
// const controls = createCameraControls(camera, renderer.domElement);
const gyroControls = createGyroControls(camera, renderer.domElement);

// Animation
function animate() {
  requestAnimationFrame(animate);
  // controls.update();
  gyroControls.update();
  // renderer.render(scene, camera);
  composer.render();
}
animate();

function updateFOV() {
  if (window.innerWidth > window.innerHeight) {
    // Landscape → reduce vertical FOV
    camera.fov = 60;
  } else {
    // Portrait → normal FOV
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

// // Fullscreen
// function requestFullscreen() {
//   const el = document.body; // or renderer.domElement
//   if (el.requestFullscreen) {
//     el.requestFullscreen();
//   } else if (el.webkitRequestFullscreen) { // Safari / iOS
//     el.webkitRequestFullscreen();
//   } else if (el.msRequestFullscreen) { // old IE/Edge
//     el.msRequestFullscreen();
//   }
// }

// // Toggle fullscreen
// function toggleFullscreen() {
//   if (!document.fullscreenElement) {
//     requestFullscreen();
//   } else {
//     if (document.exitFullscreen) {
//       document.exitFullscreen();
//     } else if (document.webkitExitFullscreen) {
//       document.webkitExitFullscreen();
//     } else if (document.msExitFullscreen) {
//       document.msExitFullscreen();
//     }
//   }
// }

// // Enter fullscreen on first touch or click
// document.addEventListener("touchstart", toggleFullscreen, { once: true });
// document.addEventListener("mousedown", toggleFullscreen, { once: true });


