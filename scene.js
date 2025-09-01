// import * as THREE from "https://unpkg.com/three@0.164.1/build/three.module.js";

// export function createScene() {
//     const scene = new THREE.Group();

//     // Floor
//     const floor = new THREE.Mesh(
//         new THREE.BoxGeometry(10, 0.5, 10), // width, height, depth
//         new THREE.MeshNormalMaterial()
//     );
//     floor.position.y = -0.25; // move it down so top is at y=0
//     scene.add(floor);

//     // Wall dimensions
//     const wallWidth = 10;
//     const wallHeight = 3;
//     const wallThickness = 0.5;

//     const wallGeometry = new THREE.BoxGeometry(wallWidth, wallHeight, wallThickness);
//     const wallMaterial = new THREE.MeshNormalMaterial();

//     // Back wall
//     const wallBack = new THREE.Mesh(wallGeometry, wallMaterial);
//     wallBack.position.set(0, wallHeight/2, -wallWidth/2);
//     scene.add(wallBack);

//     // Front wall
//     const wallFront = new THREE.Mesh(wallGeometry, wallMaterial);
//     wallFront.position.set(0, wallHeight/2, wallWidth/2);
//     scene.add(wallFront);

//     // Left wall
//     const wallLeft = new THREE.Mesh(wallGeometry, wallMaterial);
//     wallLeft.rotation.y = Math.PI / 2;
//     wallLeft.position.set(-wallWidth/2, wallHeight/2, 0);
//     scene.add(wallLeft);

//     // Right wall
//     const wallRight = new THREE.Mesh(wallGeometry, wallMaterial);
//     wallRight.rotation.y = Math.PI / 2;
//     wallRight.position.set(wallWidth/2, wallHeight/2, 0);
//     scene.add(wallRight);

//     return scene;
// }

import * as THREE from "https://unpkg.com/three@0.164.1/build/three.module.js";

export function createScene() {
    const scene = new THREE.Group();

    // Floor (checkered)
    const floorGroup = new THREE.Group();
    const tileSize = 1;
    const floorSize = 10;
    for (let x = -floorSize/2; x < floorSize/2; x++) {
        for (let z = -floorSize/2; z < floorSize/2; z++) {
            const color = (x + z) % 2 === 0 ? 0xdddddd : 0x333333;
            const tile = new THREE.Mesh(
                new THREE.BoxGeometry(tileSize, 0.1, tileSize),
                new THREE.MeshStandardMaterial({ color })
            );
            tile.position.set(x + 0.5, -0.05, z + 0.5);
            floorGroup.add(tile);
        }
    }
    scene.add(floorGroup);

    // Wall parameters
    const wallWidth = 10;
    const wallHeight = 3;
    const wallThickness = 0.3;

    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x8888ff, side: THREE.DoubleSide });
    const wallGeometry = new THREE.BoxGeometry(wallWidth, wallHeight, wallThickness);

    // Back wall
    const wallBack = new THREE.Mesh(wallGeometry, wallMaterial);
    wallBack.position.set(0, wallHeight/2, -wallWidth/2);
    scene.add(wallBack);

    // Front wall
    const wallFront = new THREE.Mesh(wallGeometry, wallMaterial);
    wallFront.position.set(0, wallHeight/2, wallWidth/2);
    scene.add(wallFront);

    // Left wall with door opening
    const wallLeftGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, wallWidth);
    const wallLeft = new THREE.Mesh(wallLeftGeometry, new THREE.MeshStandardMaterial({ color: 0xff8888 }));
    wallLeft.position.set(-wallWidth/2, wallHeight/2, 0);
    scene.add(wallLeft);

    // Right wall with different color
    const wallRightGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, wallWidth);
    const wallRight = new THREE.Mesh(wallRightGeometry, new THREE.MeshStandardMaterial({ color: 0x88ff88 }));
    wallRight.position.set(wallWidth/2, wallHeight/2, 0);
    scene.add(wallRight);

    // Ceiling
    const ceiling = new THREE.Mesh(
        new THREE.BoxGeometry(wallWidth, 0.2, wallWidth),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    ceiling.position.y = wallHeight + 0.1;
    scene.add(ceiling);

    // Table
    const tableTop = new THREE.Mesh(
        new THREE.BoxGeometry(2, 0.2, 1),
        new THREE.MeshStandardMaterial({ color: 0x8b4513 })
    );
    tableTop.position.set(0, 1, 0);
    scene.add(tableTop);

    const legGeometry = new THREE.BoxGeometry(0.1, 1, 0.1);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x5a2d0c });
    const legOffsets = [
        [-0.9, 0.5, -0.4],
        [0.9, 0.5, -0.4],
        [-0.9, 0.5, 0.4],
        [0.9, 0.5, 0.4]
    ];
    for (const [x, y, z] of legOffsets) {
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.set(x, y, z);
        scene.add(leg);
    }

    // Lamp on table
    const lampBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.5, 16),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    lampBase.position.set(0, 1.35, 0);
    scene.add(lampBase);

    const lampShade = new THREE.Mesh(
        new THREE.ConeGeometry(0.5, 0.7, 16),
        new THREE.MeshStandardMaterial({ color: 0xffff99, emissive: 0xffff33 })
    );
    lampShade.position.set(0, 1.85, 0);
    scene.add(lampShade);

    // Decorative sphere
    const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0x00aaff, metalness: 0.5, roughness: 0.3 })
    );
    sphere.position.set(-2, 0.3, 2);
    scene.add(sphere);

    // Decorative cube
    const cube = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.6, 0.6),
        new THREE.MeshStandardMaterial({ color: 0xffaa00 })
    );
    cube.position.set(2, 0.3, -2);
    scene.add(cube);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 1.2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffaa, 1, 10);
    pointLight.position.set(0, 2.5, 0);
    scene.add(pointLight);

    return scene;
}

