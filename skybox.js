import * as THREE from "three";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";

export function createSkybox(scene) {
    const exrLoader = new EXRLoader();
    exrLoader.load("DaySkyHDRI019B_4K-HDR_modified.exr", (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;

        scene.background = texture;     // show it as skybox
        scene.environment = texture;    // use it for PBR reflections
    });


}