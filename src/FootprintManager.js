import * as THREE from "three";
import { DecalGeometry } from "three/examples/jsm/geometries/DecalGeometry.js";
import { createFootprintMaterial } from "./FootprintMaterial.js";
import { getTerrainHeightAt } from "./PerlinNoise.js";

const footprintInterval = 1;
const maxFootprints = 50;

export class FootprintManager {
    constructor(scene, camera, chunkManager) {
        this.camera = camera;
        this.scene = scene;
        this.chunkManager = chunkManager;

        this.material = createFootprintMaterial();

        this.footprints = [];
        this.lastFootprintPos = { x: 0.0, y: 0.0};

        this.isRight = true;
    }

    addFootprint(x, z, angle, isRight) {
        // get current chunk
        const chunkMesh = this.chunkManager.getChunkMesh(x, z);
        if (!chunkMesh) {
            console.log("invalid footstep location");
            return;
        }

        const position = new THREE.Vector3(x, getTerrainHeightAt(x, z), z);

        const orientation = new THREE.Euler(-Math.PI / 2, 0, angle);
        const size = new THREE.Vector3(3 / 3, 7 / 3, 10);
        const geometry = new DecalGeometry(
            chunkMesh,
            position,
            orientation,
            size
        );
        const material = isRight ? this.material.right : this.material.left;
        // console.log("new footprint on ", x, z);
        return new THREE.Mesh(geometry, material);
    }

    update() {
        const sqrDistanceFromLast = (this.camera.position.x - this.lastFootprintPos.x)**2 + (this.camera.position.z - this.lastFootprintPos.y)**2;

        // add a foot print at footprintInteral distance from previous footprint
        if (sqrDistanceFromLast > footprintInterval**2) {
            // Get camera angle around up axis, use quaternion because it has been modified
            const euler = new THREE.Euler().setFromQuaternion(this.camera.quaternion, "YXZ");
            const mesh = this.addFootprint(
                this.camera.position.x,
                this.camera.position.z,
                euler.y,
                this.isRight
            );
            this.isRight = !this.isRight;
            this.scene.add(mesh);
            this.footprints.push(mesh);
            
            // Remove first footprint
            if (this.footprints.length >= maxFootprints) {
                const mesh = this.footprints[0];
                this.scene.remove(mesh);
                mesh.geometry.dispose();
                this.footprints.shift();
            }
            this.lastFootprintPos = { x: this.camera.position.x, y: this.camera.position.z };
        }
    }
}
