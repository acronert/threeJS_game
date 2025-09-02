import * as THREE from "https://unpkg.com/three@0.179.1/build/three.module.js";
import { createRoom } from "./room.js";
import { createCameraControls } from "./controls.js";
import { createRenderer } from "./renderer.js";
import { createComposer } from "./renderer.js";
import { createTerrainMesh } from "./heightmap.js";
import { createInputManager } from "./inputManager.js";
import { createGyroControls } from "./gyroControls.js";

// Scene
const scene = new THREE.Scene();
// scene.add(createRoom());

// HEIGHTMAP TEST
    // Light
    const spotlight = new THREE.SpotLight(0xffffaa, 100, 0);
    spotlight.position.set(0, 20, 0);
    scene.add(spotlight.target);
    spotlight.target.position.set(0, 0, 0);
    scene.add(spotlight);

    // const light = new THREE.AmbientLight( 0x404040 ); // soft white light
    // scene.add( light );

    const terrainMesh = createTerrainMesh();
    scene.add(terrainMesh);

/////////////////////



// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 0);

// Renderer
const renderer = createRenderer();
const composer = createComposer(renderer, scene, camera);

// Raycaster for collision
const raycaster = new THREE.Raycaster();
const down = new THREE.Vector3(0, -1, 0); // straight down

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
// const controls = createCameraControls(camera, renderer.domElement);
const controls = createGyroControls(camera, input);

// Animation
function animate() {
    requestAnimationFrame(animate);
    controls.update();

    const terrainHeight = getTerrainHeight(camera, terrainMesh);
    if (terrainHeight != null)
        camera.position.y = terrainHeight + 1.6;

    console.log("camera pos: x:", camera.position.x, ", y:", camera.position.y, ", z:", camera.position.z)
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




function getTerrainHeight(camera, terrainMesh) {
    // Start slightly above camera to ensure intersection
  const origin = camera.position.clone();
  origin.y += 100; // or some safe offset above highest terrain point

  raycaster.set(origin, down);

  const intersects = raycaster.intersectObject(terrainMesh, true);
  if (intersects.length > 0) {
    return intersects[0].point.y; // Y coordinate of intersection
  }

  return null; // no terrain found
}