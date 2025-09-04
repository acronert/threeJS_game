import * as THREE from "three";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";

export function create360Environment(scene) {
    const exrLoader = new EXRLoader();
    exrLoader.load("DayEnvironmentHDRI053_4K-HDR.exr", (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;

        scene.background = texture;     // optional: show it as skybox
        scene.environment = texture;    // important: use it for PBR reflections
    });

    const geometry = new THREE.SphereGeometry(30, 64, 64);
    const material = new THREE.MeshStandardMaterial();

    const sphere = new THREE.Mesh(geometry, material);

    return (sphere);
}