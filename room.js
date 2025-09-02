import * as THREE from "three";

export function createRoom() {
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
    const ambientLight = new THREE.AmbientLight(0x404040, 4);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffaa, 1.5, 20);
    pointLight.position.set(0, 2.5, 0);
    scene.add(pointLight);

    // Carpet (flat box or plane)
    const carpet = new THREE.Mesh(
        new THREE.BoxGeometry(4, 0.05, 2),
        new THREE.MeshStandardMaterial({ color: 0xaa3333 })
    );
    carpet.position.set(0, 0.025, 0); // small offset so it doesn't z-fight floor
    scene.add(carpet);

    // Plant (pot + green leaves)
    const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.4, 0.4, 16),
        new THREE.MeshStandardMaterial({ color: 0x884422 })
    );
    pot.position.set(-3, 0.2, -3);
    scene.add(pot);

    const plant = new THREE.Mesh(
        new THREE.ConeGeometry(0.8, 1.2, 16),
        new THREE.MeshStandardMaterial({ color: 0x228833 })
    );
    plant.position.set(-3, 1.0, -3);
    scene.add(plant);

    // Second room connected (simple doorway in left wall)
    const doorWidth = 2;
    const doorHeight = 2;

    // Remove left wall and rebuild with doorway
    scene.remove(wallLeft);

    // Left wall split into top and bottom (around door)
    const wallLeftTop = new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, wallHeight - doorHeight, wallWidth),
        new THREE.MeshStandardMaterial({ color: 0xff8888 })
    );
    wallLeftTop.position.set(-wallWidth/2, wallHeight - (wallHeight - doorHeight)/2, 0);
    scene.add(wallLeftTop);

    const wallLeftBottom = new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, doorHeight, (wallWidth - doorWidth)/2),
        new THREE.MeshStandardMaterial({ color: 0xff8888 })
    );
    wallLeftBottom.position.set(-wallWidth/2, doorHeight/2, -(wallWidth/2 - doorWidth/2));
    scene.add(wallLeftBottom);

    const wallLeftBottom2 = new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, doorHeight, (wallWidth - doorWidth)/2),
        new THREE.MeshStandardMaterial({ color: 0xff8888 })
    );
    wallLeftBottom2.position.set(-wallWidth/2, doorHeight/2, (wallWidth/2 - doorWidth/2));
    scene.add(wallLeftBottom2);

    // Create second room (same size, offset)
    const secondRoom = new THREE.Group();

    // Floor
    const secondFloor = floorGroup.clone();
    secondFloor.position.x = -wallWidth; // move left of first room
    secondRoom.add(secondFloor);

    // Walls
    const wallBack2 = wallBack.clone();
    wallBack2.position.x -= wallWidth;
    secondRoom.add(wallBack2);

    const wallFront2 = wallFront.clone();
    wallFront2.position.x -= wallWidth;
    secondRoom.add(wallFront2);

    const wallRight2 = wallLeft.clone(); // opposite side
    wallRight2.position.x -= wallWidth;
    secondRoom.add(wallRight2);

    const wallLeft2 = wallRight.clone();
    wallLeft2.position.x -= wallWidth * 2;
    secondRoom.add(wallLeft2);

    // Ceiling
    const ceiling2 = ceiling.clone();
    ceiling2.position.x -= wallWidth;
    secondRoom.add(ceiling2);

    // Standing lamp in second room
    const lampGroup = new THREE.Group();

    // Base
    const lampBase2 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16),
        new THREE.MeshStandardMaterial({ color: 0x444444 })
    );
    lampBase2.position.set(0, 0.05, 0);
    lampGroup.add(lampBase2);

    // Pole
    const lampPole2 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 2, 16),
        new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    lampPole2.position.set(0, 1.05, 0);
    lampGroup.add(lampPole2);

    // Shade
    const lampShade2 = new THREE.Mesh(
        new THREE.ConeGeometry(0.6, 0.8, 16),
        new THREE.MeshStandardMaterial({ color: 0xffffcc, emissive: 0xffff55 })
    );
    lampShade2.position.set(0, 2, 0);
    lampGroup.add(lampShade2);

    // Light source
    const lampLight2 = new THREE.PointLight(0xffffaa, 2, 12);
    lampLight2.position.set(0, 2, 0);
    lampGroup.add(lampLight2);

    // Position the whole lamp in the second room (e.g., near a corner)
    lampGroup.position.set(-wallWidth, 0, 3);
    secondRoom.add(lampGroup);

    pointLight.castShadow = true;
    lampLight2.castShadow = true;

    // Floor
    floorGroup.children.forEach(tile => tile.receiveShadow = true);

    // Table
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    legGeometry.castShadow = true; // but since it's geometry, apply after making mesh
    legMaterial.castShadow = true;

    // Lamp on table
    lampBase.castShadow = true;

    // Decorative objects
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    cube.castShadow = true;
    cube.receiveShadow = true;

    // Carpet
    carpet.receiveShadow = true;

    // Plant
    pot.castShadow = true;
    pot.receiveShadow = true;
    plant.castShadow = true;

    lampBase2.castShadow = true;
    lampPole2.castShadow = true;
    secondFloor.children.forEach(tile => tile.receiveShadow = true);


    scene.add(secondRoom);

    return scene;
}

