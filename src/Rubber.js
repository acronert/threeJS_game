import * as THREE from "three";

export class Rubber {
    constructor() {
        this.rubberMesh = new THREE.Group();

        // MATERIAL
        const rubberMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222
        });

        // GEOMETRY
        const tubeWidth = 0.4;
        const rimWidth = 0.05
        // Outer tube
        const tube = new THREE.Shape();
        const tubeOuterRadius = 0.55;
        const tubeInnerRadius = 0.50;

        tube.absarc(0, 0, tubeOuterRadius, 0, Math.PI * 2);

        const tubeHole = new THREE.Path();
        tubeHole.absarc(0, 0, tubeInnerRadius, 0, Math.PI * 2);
        tube.holes.push(tubeHole);

        const tubeExtrudeSettings = {
            depth: tubeWidth,
            bevelEnabled: false
        };
        const tubeGeometry = new THREE.ExtrudeGeometry(tube, tubeExtrudeSettings);
        const tubeMesh = new THREE.Mesh(tubeGeometry, rubberMaterial);

        // Rims
        const rim = new THREE.Shape();
        const rimOuterRadius = 0.55;
        const rimInnerRadius = 0.30;

        rim.absarc(0, 0, rimOuterRadius, 0, Math.PI * 2);

        const rimHole = new THREE.Path();
        rimHole.absarc(0, 0, rimInnerRadius, 0, Math.PI * 2);
        rim.holes.push(rimHole);

        const rimExtrudeSettings = {
            depth: 0.05,       // thickness
            bevelEnabled: false,
            // bevelEnabled: true,
            // bevelSegments: 2,
            // bevelSize: 0.025,    // how far the bevel sticks out
            // bevelThickness: 0.025,
            // curveSegments: 16   // controls smoothness of the profile
        };
        const rimGeometry = new THREE.ExtrudeGeometry(rim, rimExtrudeSettings);
        const rimMesh = new THREE.Mesh(rimGeometry, rubberMaterial);

        // Assembly
        const rimMesh2 = rimMesh.clone();

        // Tube: center it at Z=0
        tubeMesh.position.z = -tubeWidth / 2;  // shifts tube from [-0.15, +0.15]

        // Rim: front
        rimMesh.position.z = tubeWidth / 2 - rimWidth; // front end of the tube
        // Rim: back
        rimMesh2.position.z = -tubeWidth / 2;          // back end of the tube

        this.rubberMesh.add(tubeMesh);
        this.rubberMesh.add(rimMesh);
        this.rubberMesh.add(rimMesh2);
    }

    getRubberMesh() {
        return this.rubberMesh;
    }
}

