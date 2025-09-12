import * as THREE from "three";
import { createRenderer, createComposer } from "./Renderer.js";
import { ControlManager } from "./ControlManager.js";
import { createSkybox } from "./Skybox.js";
import { ChunkManager } from "./ChunkManager.js";
import { DesertEnvironment, SnowEnvironment } from "./AEnvironment.js";
import { Player } from "./Player.js"

const environment_button = document.getElementById("environment_button");
const fullscreen_button = document.getElementById("fullscreen_button");
const help_button = document.getElementById("help_button");
const help = document.getElementById("help");
const pause_screen = document.getElementById("pause_screen");

// Fullscreen switch
fullscreen_button.addEventListener("click", () => {
  if (!document.fullscreenElement) {
    document.body.requestFullscreen?.() ||
      document.body.webkitRequestFullscreen?.() ||
      document.body.msRequestFullscreen?.();
  } else {
    document.exitFullscreen?.() ||
      document.webkitExitFullscreen?.() ||
      document.msExitFullscreen?.();
  }
});

// Help menu display
help_button.addEventListener("click", () => {
  if (help.style.display == "block")
    help.style.display = "none";
  else
    help.style.display = "block"
});


class Simulation {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 8000);
    this.renderer = createRenderer();
    this.composer = createComposer(this.renderer, this.scene, this.camera);


    // Create Enviroment class
    const chunkSize = 32;
    this.chunkManager = new ChunkManager(this.scene, this.camera, chunkSize);
    this.player = new Player(this.camera, this.scene, this.chunkManager);
    this.environment = new DesertEnvironment(this.scene, this.camera, this.chunkManager, this.player);


    this.controlsManager = new ControlManager(this.renderer.domElement);

    this.animate = this.animate.bind(this);
    this.handleResize = this.handleResize.bind(this);

    this.fps = 0;
    this.lastFpsUpdate = 0;
    this.frames = 0;
    this.lastFrameTime = 0;

    this.pause = false;
  }


  handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.fov = window.innerWidth > window.innerHeight ? 60 : 80;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  changeEnvironment() {
    console.log("click environment");
    if (this.environment instanceof DesertEnvironment) {
      console.log("SNOW");
      this.environment = new SnowEnvironment(this.scene, this.camera, this.chunkManager, this.player);
    } else if (this.environment instanceof SnowEnvironment) {
      console.log("DESERT");
      this.environment = new DesertEnvironment(this.scene, this.camera, this.chunkManager, this.player);
    }
  }

  start() {
    environment_button.addEventListener("click", this.changeEnvironment.bind(this));

    window.addEventListener("blur", () => {
      console.log("Pause");
      pause_screen.style.display = "block";
      this.pause = true;
    });
    
    window.addEventListener("focus", () => {
      console.log("Unpause");
      pause_screen.style.display = "none";
      this.pause = false;
    });

    window.addEventListener('resize', this.handleResize);
    this.handleResize();

    this.sky = createSkybox(this.scene);

    const interval = setInterval(() => {
      this.environment.updateChunks();
    }, 500);

    this.animate()
  }

  updateFPS(now) {
    this.fps++;
    if (now - this.lastFpsUpdate >= 1000) {
      document.getElementById("fps_counter").textContent = "FPS: " + this.fps;
      this.fps = 0;
      this.lastFpsUpdate = now;
    }
  }

  animate() {
    requestAnimationFrame(this.animate);
    if (this.pause) {
      this.lastFrameTime = performance.now(); // else the delta is gigenormous
      return;
    }

    // Calculate delta
    const now = performance.now();
    const delta = (now - this.lastFrameTime) / 1000; // in seconds
    this.lastFrameTime = now;

    this.updateFPS(now);

    // Update game
    // this.chunkManager.updateMaterial(this.camera); // update curvature based on camera.pos
    const controls = this.controlsManager.update(delta);

    this.player.update(delta, controls); // update Player position and physic
    this.sky.update(this.camera.position); // make the shadow light follow the camera

    this.composer.render();
  }
}

function main() {
  const simulation = new Simulation();
  simulation.start();
}

main();