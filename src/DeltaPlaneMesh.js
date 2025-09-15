import * as THREE from "three"

export function createDeltaPlaneMesh() {
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.5);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00} );

    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
}