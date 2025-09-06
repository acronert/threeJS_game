import * as THREE from "three";

export class Chunk {
    constructor(coord, size, resolution, vertices, material) {
        this.coord = coord;
        this.size = size;

        const geometry = new THREE.PlaneGeometry(size, size, resolution - 1, resolution - 1);
        const positions = geometry.attributes.position;

        // Set vertex height
        for (let i = 0; i < positions.count; i++) {
            positions.setZ(i, vertices[i]);
        }
        positions.needsUpdate = true;
        geometry.computeVertexNormals();

        // Place the chunk in world space
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.position.set(coord.x * size, 0, coord.y * size);
    }

    addTo(scene) {
        scene.add(this.mesh);
    }

    removeFrom(scene) {
        scene.remove(this.mesh);
        this.mesh.geometry.dispose();
    }
}