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

// Display gyroscope data
const gyroDiv = document.getElementById("gyroData");

window.addEventListener("devicemotion", (event) => {
  const alpha = event.alpha;
  const beta = event.beta;
  const gamma = event.gamma;
  gyroDiv.innerHTML = `Alpha: $(alpha)<br>Beta: $(beta)<br>Gamma: $(gamma)`;
});