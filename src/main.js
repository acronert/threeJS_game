import * as THREE from "three";
import { createRenderer, createComposer } from "./Renderer.js";
import { createInputManager } from "./InputManager.js";
import { createControls } from "./Controls.js";
import { createSkybox } from "./Skybox.js";
import { ChunkManager } from "./ChunkManager.js";
import { FootprintManager } from "./FootprintManager.js";

import { createMonolith } from "./Monolith.js";

class Simulation {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 8000);
        this.renderer = createRenderer();

        this.animate = this.animate.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.toggleFullscreen = this.toggleFullscreen.bind(this);

        this.fps = 0;
        this.lastFpsUpdate = 0;
        this.frames = 0;
        this.lastFrameTime = 0;
    }

    init() {
        const chunkSize = 128;
        this.chunkManager = new ChunkManager(this.scene, this.camera, chunkSize);

        this.footprintManager = new FootprintManager(this.scene, this.camera, this.chunkManager);

        this.camera.position.set(0, 50, 0);
        this.composer = createComposer(this.renderer, this.scene, this.camera);

        this.input = createInputManager(this.renderer.domElement);
        this.controls = createControls(this.camera, this.input);

        window.addEventListener('resize', this.handleResize);
        this.handleResize();

        // Fullscreen on first click
        document.addEventListener("touchstart", this.toggleFullscreen, { once: true });
        document.addEventListener("mousedown", this.toggleFullscreen, { once: true });
    }

    requestFullscreen() {
        const el = document.body; // or this.renderer.domElement
        if (el.requestFullscreen) el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen(); // Safari
        else if (el.msRequestFullscreen) el.msRequestFullscreen(); // old IE/Edge
    }

    exitFullscreen() {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) this.requestFullscreen();
        else this.exitFullscreen();
    }

    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.fov = window.innerWidth > window.innerHeight ? 60 : 80;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    start() {
        createSkybox(this.scene);

        // const monolith_mesh = createMonolith();
        // this.scene.add(monolith_mesh);

        const interval = setInterval(() => {
            this.chunkManager.update();
            this.footprintManager.update();

        }, 250);

        this.animate()
    }

    animate() {
        requestAnimationFrame(this.animate);

        // Calculate the time to complete a animation cycle
        const now = performance.now();
        const delta = (now - this.lastFrameTime) / 1000; // delta in seconds
        this.lastFrameTime = now;

        // Count FPS
        this.frames++;
        if (now - this.lastFpsUpdate >= 1000) {
            this.fps = this.frames;
            console.log("FPS:", this.fps);
            this.frames = 0;
            this.lastFpsUpdate = now;
        }

        this.chunkManager.updateMaterial(this.camera);

        this.controls.update(delta);
        this.composer.render();
    }
}

function main() {
    const simulation = new Simulation();

    simulation.init();
    simulation.start();
}

main();