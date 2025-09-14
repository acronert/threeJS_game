import * as THREE from "three";

export function createSnowBoardMesh() {
    const board = new THREE.Group();

    const material = new THREE.MeshStandardMaterial({
        color: 0xff0000,
    });
    
    const length = 1.4;   // meters
    const width = 0.3;
    const thickness = 0.03;
    
    // Main flat part
    const baseGeom = new THREE.BoxGeometry(width, thickness, length);
    const base = new THREE.Mesh(baseGeom, material);
    board.add(base);
    
    // Rounded tips (curved along length, not vertical)
    const tipGeom = new THREE.CylinderGeometry(width / 2, width / 2, thickness, 32, 1, false);
    tipGeom.rotateY(Math.PI / 2); // lay cylinder flat
    
    const tipFront = new THREE.Mesh(tipGeom, material);
    tipFront.position.z = length / 2;
    board.add(tipFront);
    
    const tipBack = tipFront.clone();
    tipBack.position.z = -length / 2;
    board.add(tipBack);

    return board;
}
