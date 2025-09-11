import * as THREE from "three";
import { DecalGeometry } from "three/examples/jsm/geometries/DecalGeometry.js";
import { getTerrainHeightAt } from "./PerlinNoise.js";
import { createTiretracksMaterial } from "./TiretracksMaterial.js";

const tracksInterval = 0.5;
const maxDecals = 100;

export class TiretracksManager {
    constructor(scene, camera, chunkManager) {
        this.camera = camera;
        this.scene = scene;
        this.chunkManager = chunkManager;

        this.material = createTiretracksMaterial();

        // this.material = new THREE.MeshStandardMaterial({color: 0xff0000});

        this.tracks = [];
        this.lastTrackPos = { x: 0.0, z: 0.0};
    }

    addTrail(x, z, angle, speed) {
        // get current chunk
        const chunkMesh = this.chunkManager.getChunkMesh(x, z);
        if (!chunkMesh) {
            console.log("invalid footstep location");
            return;
        }

        const position = new THREE.Vector3(x, getTerrainHeightAt(x, z), z);
        const orientation = new THREE.Euler(-Math.PI / 2, 0, angle);
        const size = new THREE.Vector3(0.4, 1.0, 1);
        const geometry = new DecalGeometry(
            chunkMesh,
            position,
            orientation,
            size
        );
        return new THREE.Mesh(geometry, this.material);
    }

    update(position, angle) {
        const sqrDistanceFromLast = (position.x - this.lastTrackPos.x)**2 + (position.z - this.lastTrackPos.z)**2;

        // add a foot print at footprintInteral distance from previous footprint
        if (sqrDistanceFromLast > tracksInterval**2) {
            const mesh = this.addTrail(
                position.x,
                position.z,
                angle
            );
            if (mesh) {
                this.scene.add(mesh);
                this.tracks.push(mesh);
            }
            
            // Remove first footprint
            if (this.tracks.length >= maxDecals) {
                const mesh = this.tracks[0];
                this.scene.remove(mesh);
                if (mesh.geometry) mesh.geometry.dispose();
                this.tracks.shift();
            }
            this.lastTrackPos = { x: position.x, z: position.z };
        }
    }
}
