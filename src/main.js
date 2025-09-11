import * as THREE from "three";
import { createRenderer, createComposer } from "./Renderer.js";
import { ControlManager } from "./ControlManager.js";
import { createSkybox } from "./Skybox.js";
import { ChunkManager } from "./ChunkManager.js";
import { Player } from "./Player.js"

const fullscreen_button = document.getElementById("fullscreen_button");

fullscreen_button.addEventListener("click", () => {
    if (!document.fullscreenElement &&
        !document.webkitFullscreenElement &&
        !document.msFullscreenElement) {
        // enter fullscreen
        const el = document.body; // or this.renderer.domElement
        if (el.requestFullscreen) el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen(); // Safari
        else if (el.msRequestFullscreen) el.msRequestFullscreen(); // old IE/Edge
    } else {
        // exit fullscreen
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
    }
});

const help_button = document.getElementById("help_button");
const help = document.getElementById("help");

help_button.addEventListener("click", () => {
    console.log("help button");

    if (help.style.display == "block")
        help.style.display = "none";
    else
        help.style.display = "block"
});

class Simulation {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 8000);
        this.renderer = createRenderer();

        this.animate = this.animate.bind(this);
        this.handleResize = this.handleResize.bind(this);
        // this.toggleFullscreen = this.toggleFullscreen.bind(this);

        this.fps = 0;
        this.lastFpsUpdate = 0;
        this.frames = 0;
        this.lastFrameTime = 0;
    }



    // requestFullscreen() {
    //     const el = document.body; // or this.renderer.domElement
    //     if (el.requestFullscreen) el.requestFullscreen();
    //     else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen(); // Safari
    //     else if (el.msRequestFullscreen) el.msRequestFullscreen(); // old IE/Edge
    // }

    // exitFullscreen() {
    //     if (document.exitFullscreen) document.exitFullscreen();
    //     else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    //     else if (document.msExitFullscreen) document.msExitFullscreen();
    // }

    // toggleFullscreen() {
    //     if (!document.fullscreenElement) this.requestFullscreen();
    //     else this.exitFullscreen();
    // }

    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.fov = window.innerWidth > window.innerHeight ? 60 : 80;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    init() {
        const chunkSize = 32;
        this.chunkManager = new ChunkManager(this.scene, this.camera, chunkSize);
        
        this.player = new Player(this.camera, this.scene, this.chunkManager);

        this.controlsManager = new ControlManager(this.renderer.domElement);

        window.addEventListener('resize', this.handleResize);
        this.handleResize();

        // Fullscreen on first click
        // document.addEventListener("touchstart", this.toggleFullscreen, { once: true });
        // document.addEventListener("mousedown", this.toggleFullscreen, { once: true });
    }

    start() {
        this.init();

        this.sky = createSkybox(this.scene);

        this.composer = createComposer(this.renderer, this.scene, this.camera);

        const interval = setInterval(() => {
            this.chunkManager.update();
        }, 1000);

        this.animate()
    }

    updateFPS() {
        const now = performance.now();
        this.frames++;
        if (now - this.lastFpsUpdate >= 1000) {
            this.fps = this.frames;
            document.getElementById("fps_counter").textContent = "FPS: " + this.fps;
            // console.log("FPS:", this.fps);
            this.frames = 0;
            this.lastFpsUpdate = now;
        }
    }

    animate() {
        requestAnimationFrame(this.animate);

        // Calculate delta
        const now = performance.now();
        const delta = (now - this.lastFrameTime) / 1000; // delta in seconds
        this.lastFrameTime = now;

        // Count FPS
        this.updateFPS();

        // update for the curvature (camera pos is the center of the curve)
        this.chunkManager.updateMaterial(this.camera);
        const controls = this.controlsManager.update(delta);
        this.player.update(delta, controls);


        this.sky.update(this.camera.position); // make the shadow light follow the camera
        this.composer.render();
    }
}

function main() {
    const simulation = new Simulation();

    simulation.start();
}

main();