import * as THREE from "three";
import { Footprints } from "./ATerrainDecal.js";

const speed = 10; // m/s

export class Walker {
    constructor(camera, scene, chunkManager) {
        this.camera = camera;
        this.chunkManager = chunkManager;

        this.footprints = new Footprints(scene, chunkManager);

        this.position = new THREE.Vector3();
        this.rotation = new THREE.Vector3();
    }

    setPosition(x, z) {
        this.position.x = x;
        this.position.z = z;
    }

    update(delta, controls) {
       // Movement
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(controls.orientationQuat);
        forward.y = 0; // keep movement on ground plane
        forward.normalize();
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(controls.orientationQuat);
        right.y = 0;
        right.normalize();
        const up = new THREE.Vector3(0, 1, 0); // world up, or rotate with camera if you prefer

        if (controls.forward)   this.position.addScaledVector(forward, speed * delta);
        if (controls.backward)  this.position.addScaledVector(forward, -speed * delta);
        if (controls.right)   this.position.addScaledVector(right, speed * delta);
        if (controls.left)  this.position.addScaledVector(right, -speed * delta);
        if (controls.up)   this.position.addScaledVector(up, speed * delta);
        if (controls.down)  this.position.addScaledVector(up, -speed * delta);

        this.position.y = this.chunkManager.getHeightAt(this.position.x, this.position.z) + 1.7;

        // Apply rotation and movement
        this.camera.position.copy(this.position);
        this.camera.quaternion.copy(controls.orientationQuat);

        // Footprints
        const euler = new THREE.Euler();
        euler.setFromQuaternion(this.camera.quaternion, "YXZ");
        this.footprints.update(this.position.x, this.position.z, euler.y);
    
    }
}