import * as THREE from "three";
import { DecalGeometry } from "three/examples/jsm/geometries/DecalGeometry.js";
import { createFootprintMaterial, createTiretrackMaterial } from "./Materials.js"

export class ATerrainDecal {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.decals = [];
        this.lastDecalPos = { x: 0.0, z: 0.0 };
        this.maxDecals = 50;
        this.decalSize = new THREE.Vector3();
    }

    updateMaterialColor(colorMap) {
        this.material.map = colorMap;
        this.material.needsUpdate = true;
    }

    update(x, z, angle) {
        const sqrDistance = (x - this.lastDecalPos.x)**2 + (z - this.lastDecalPos.z)**2;
        
        if (sqrDistance > this.decalInterval**2) {
            const decal = this.createDecal(x, z, angle);
            
            if (!decal) return;

            this.scene.add(decal);
            this.decals.push(decal);
            this.lastDecalPos = { x: x, z: z };

            if (this.decals.length > this.maxDecals) {
                const old = this.decals[0];
                this.scene.remove(old);
                old.geometry.dispose();
                this.decals.shift();
            }
        }
    }

    createDecal(x, z, angle) {
        const targetMesh = this.world.chunkManager.getChunkMesh(x, z);
        if (!targetMesh) {
            console.log("invalid decal position");
            return;
        }
        const geometry = new DecalGeometry(
            targetMesh,
            new THREE.Vector3(x, this.world.getHeightAt(x, z), z),
            new THREE.Euler(-Math.PI / 2, 0, angle),
            this.decalSize,
        );
        const material = this.getDecalMaterial();
        return new THREE.Mesh(geometry, material);
    }
}


export class Footprints extends ATerrainDecal {
    constructor(scene, world) {
        super(scene, world)
            this.decalInterval = 1.0;
            this.material = createFootprintMaterial();
            this.isRigth = true;
            this.decalSize.set(0.4, 0.4, 1.0);
    }

    getDecalMaterial() {
        const mat = this.isRigth ? this.material.right : this.material.left;
        this.isRigth = !this.isRigth;
        return mat;
    }

    updateMaterialColor(colorMap) {
        this.material.left.map = colorMap;
        this.material.right.map = colorMap;
    }
}

export class Tiretracks extends ATerrainDecal {
    constructor(scene, world) {
        super(scene, world)
            this.decalInterval = 0.5;
            this.material = createTiretrackMaterial();
            this.decalSize.set(0.6, 1.0, 1.0);
    }
    getDecalMaterial() {
        return this.material;
    }
}