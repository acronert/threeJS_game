import * as THREE from "https://unpkg.com/three@0.164.1/build/three.module.js";

export function createScene() {
    const scene = new THREE.Group();

    // Floor
    const floor = new THREE.Mesh(
        new THREE.BoxGeometry(10, 0.5, 10), // width, height, depth
        new THREE.MeshNormalMaterial()
    );
    floor.position.y = -0.25; // move it down so top is at y=0
    scene.add(floor);

    // Wall dimensions
    const wallWidth = 10;
    const wallHeight = 3;
    const wallThickness = 0.5;

    const wallGeometry = new THREE.BoxGeometry(wallWidth, wallHeight, wallThickness);
    const wallMaterial = new THREE.MeshNormalMaterial();

    // Back wall
    const wallBack = new THREE.Mesh(wallGeometry, wallMaterial);
    wallBack.position.set(0, wallHeight/2, -wallWidth/2);
    scene.add(wallBack);

    // Front wall
    const wallFront = new THREE.Mesh(wallGeometry, wallMaterial);
    wallFront.position.set(0, wallHeight/2, wallWidth/2);
    scene.add(wallFront);

    // Left wall
    const wallLeft = new THREE.Mesh(wallGeometry, wallMaterial);
    wallLeft.rotation.y = Math.PI / 2;
    wallLeft.position.set(-wallWidth/2, wallHeight/2, 0);
    scene.add(wallLeft);

    // Right wall
    const wallRight = new THREE.Mesh(wallGeometry, wallMaterial);
    wallRight.rotation.y = Math.PI / 2;
    wallRight.position.set(wallWidth/2, wallHeight/2, 0);
    scene.add(wallRight);

    return scene;
}
