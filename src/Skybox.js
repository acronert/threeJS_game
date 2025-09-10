import * as THREE from "three";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";

export function createSkybox(scene) {
    const exrLoader = new EXRLoader();
    exrLoader.load("./assets/DaySkyHDRI019B_4K-HDR_modified.exr", (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;

        scene.background = texture;     // background texture
        // scene.environment = null;    // HDRI lighting
        scene.environment = texture;    // HDRI lighting
        
    });


    // const sun = new THREE.DirectionalLight(0xffffff, 2.0);
    // sun.castShadow = true;
    // sun.userData.shadowOnly = true;
    
    // const angle = THREE.MathUtils.degToRad(40);

    // sun.position.set(
    //     Math.cos(angle) * 100,
    //     Math.sin(angle) * 100,
    //     0
    // );

    // sun.target.position.set(0, 0, 0);
    // scene.add(sun.target);
    // scene.add(sun);

    // // Shadows config
    // sun.shadow.mapSize.set(2048, 2048);
    // sun.shadow.camera.near = 1;
    // sun.shadow.camera.far = 500;
    // sun.shadow.camera.left = -50;
    // sun.shadow.camera.right = 50;
    // sun.shadow.camera.top = 50;
    // sun.shadow.camera.bottom = -50;
}