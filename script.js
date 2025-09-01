import * as THREE from "https://unpkg.com/three@0.164.1/build/three.module.js";
import { createScene } from "./scene.js";
import { createCameraControls } from "./controls.js";


// Scene
const scene = new THREE.Scene();
scene.add(createScene());

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/(window.innerHeight), 0.1, 1000);
camera.position.set(0, 1.6, 5);

// Renderer
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.setSize(800, 600);  

// Controls
const controls = createCameraControls(camera, renderer.domElement);

// Animation
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Responsive resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

if (window.DeviceOrientationEvent) {
  window.addEventListener(
    "deviceorientation",
    (event) => {
      const alpha = event.alpha; // alpha: rotation around z-axis
      const gamma = event.gamma; // gamma: left to right
      const beta = event.beta; // beta: front back motion

      handleOrientationEvent(beta, gamma, alpha);
    },
    true,
  );
}

const handleOrientationEvent = (beta, gamma, alpha) => {
  console.log("alpha = ", alpha);
  console.log("beta = ", beta);
  console.log("gamma = ", gamma);
};

// // Display gyroscope data
// const gyroDiv = document.getElementById("gyroData");

// window.addEventListener("deviceorientation", (event) => {
//   const alpha = event.alpha?.toFixed(2) ?? 0; // z rotation
//   const beta  = event.beta?.toFixed(2) ?? 0;  // x tilt
//   const gamma = event.gamma?.toFixed(2) ?? 0; // y tilt
//   gyroDiv.innerHTML = `Alpha: ${alpha}<br>Beta: ${beta}<br>Gamma: ${gamma}`;
// });