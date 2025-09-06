import * as THREE from "three";
import { createRenderer, createComposer } from "./Renderer.js";
import { createInputManager } from "./InputManager.js";
import { createControls } from "./Controls.js";
import { createSkybox } from "./Skybox.js";
import { ChunkManager } from "./ChunkManager.js";

class Simulation {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 4096);
        this.renderer = createRenderer();

        this.animate = this.animate.bind(this);

        this.handleResize = this.handleResize.bind(this);
        this.toggleFullscreen = this.toggleFullscreen.bind(this);

    }

    init() {
        const chunkSize = 128;
        const chunkDepth = 10;
        this.chunkManager = new ChunkManager(this.scene, this.camera, chunkSize, chunkDepth);

        this.camera.position.set(0, 10, 0);
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

        const interval = setInterval(() => {
            this.chunkManager.update();
        }, 500);

        this.animate()
    }

    animate() {
        requestAnimationFrame(this.animate);
        this.controls.update();
        this.composer.render();
    }
}

function main() {
    const simulation = new Simulation();

    simulation.init();
    simulation.start();
}

main();