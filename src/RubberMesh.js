import * as THREE from "three";

export function createRubberMesh(rubberRadius) {
    const rubberMesh = new THREE.Group();

    // MATERIAL
    const loader = new THREE.TextureLoader();
    const normal = loader.load('./assets/TireTracks001_1K-JPG/TireTracks001_1K-JPG_NormalGL.jpg');
    
    [normal].forEach(tex => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(1, 2.5);
    });

    const tubeMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        normalMap: normal,
        normalScale: new THREE.Vector2(4, 4)
    });
    const rimMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
    });

    // GEOMETRY
    const tubeWidth = 0.4;
    const rimWidth = 0.05
    // Outer tube
    const tube = new THREE.Shape();
    const tubeInnerRadius = 0.50;

    tube.absarc(0, 0, rubberRadius, 0, Math.PI * 2);

    const tubeHole = new THREE.Path();
    tubeHole.absarc(0, 0, tubeInnerRadius, 0, Math.PI * 2);
    tube.holes.push(tubeHole);

    const tubeExtrudeSettings = {
        depth: tubeWidth,
        bevelEnabled: false,
        curveSegments: 32
    };
    const tubeGeometry = new THREE.ExtrudeGeometry(tube, tubeExtrudeSettings);
    const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
    tubeMesh.castShadow = true;

    // Rims
    const rim = new THREE.Shape();
    const rimInnerRadius = 0.30;

    rim.absarc(0, 0, rubberRadius - 0.051 , 0, Math.PI * 2);

    const rimHole = new THREE.Path();
    rimHole.absarc(0, 0, rimInnerRadius, 0, Math.PI * 2);
    rim.holes.push(rimHole);

    const rimExtrudeSettings = {
        depth: 0.05,       // thickness
        bevelEnabled: false,
        bevelEnabled: true,
        bevelSegments: 2,
        bevelSize: 0.05,    // how far the bevel sticks out
        bevelThickness: 0.05,
        curveSegments: 32   // controls smoothness of the profile
    };
    const rimGeometry = new THREE.ExtrudeGeometry(rim, rimExtrudeSettings);
    const rimMesh = new THREE.Mesh(rimGeometry, rimMaterial);
    rimMesh.castShadow = true;

    // Assembly
    const rimMesh2 = rimMesh.clone();
    tubeMesh.rotation.y = Math.PI / 2;
    rimMesh.rotation.y = Math.PI / 2;
    rimMesh2.rotation.y = Math.PI / 2;

    tubeMesh.position.x = -tubeWidth / 2;  // shifts tube from [-0.15, +0.15]
    rimMesh.position.x = tubeWidth / 2 - rimWidth; // front end of the tube
    rimMesh2.position.x = -tubeWidth / 2;          // back end of the tube

    rubberMesh.add(tubeMesh);
    rubberMesh.add(rimMesh);
    rubberMesh.add(rimMesh2);

    rubberMesh.castShadow = true;

    return rubberMesh;
}