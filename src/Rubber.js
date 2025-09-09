import * as THREE from "three";
import { getNormalAt, getTerrainHeightAt } from "./PerlinNoise.js";


function createRubberMesh(rubberRadius) {
        const rubberMesh = new THREE.Group();

        // MATERIAL
        const rubberMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222
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
            bevelEnabled: false
        };
        const tubeGeometry = new THREE.ExtrudeGeometry(tube, tubeExtrudeSettings);
        const tubeMesh = new THREE.Mesh(tubeGeometry, rubberMaterial);

        // Rims
        const rim = new THREE.Shape();
        const rimInnerRadius = 0.30;

        rim.absarc(0, 0, rubberRadius, 0, Math.PI * 2);

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

        tubeMesh.position.z = -tubeWidth / 2;  // shifts tube from [-0.15, +0.15]
        rimMesh.position.z = tubeWidth / 2 - rimWidth; // front end of the tube
        rimMesh2.position.z = -tubeWidth / 2;          // back end of the tube

        rubberMesh.add(tubeMesh);
        rubberMesh.add(rimMesh);
        rubberMesh.add(rimMesh2);

        // test cube
        const cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({color: 0xff0000}));
        rubberMesh.add(cube);


        return rubberMesh;
    }

export class Rubber {
    constructor() {
        this.rubberRadius = 0.55;

        this.rubberMesh = createRubberMesh(this.rubberRadius);

        this.position = this.rubberMesh.position;
        this.rotation = this.rubberMesh.rotation;
        this.speed = new THREE.Vector3();
        this.acceleration = new THREE.Vector3();
        this.isOnGround = true;
    }

    update(delta, scene) {
        
        // calculate acceleration ( gravity, input controls, friction)
        this.acceleration.set(0, -9.81, 0); // gravity
        
        // calculate speed
        this.speed.addScaledVector(this.acceleration, delta);
        
        // calculate position
        this.position.addScaledVector(this.speed, delta);
        
        // clamp to terrain
        const height = getTerrainHeightAt(this.position.x, this.position.z);
        if (this.position.y < height + this.rubberRadius) {
            this.position.y = height + this.rubberRadius
            const bounce_restitution = 0.65;
            this.speed.y = -this.speed.y * bounce_restitution;

            // align rubber with normal
            const n = getNormalAt(this.position.x, this.position.z, 0.25);
            const groundNormal = new THREE.Vector3(n.x, n.z, n.y); // invert z and y to put y up
            
            const arrow = new THREE.ArrowHelper(groundNormal, this.position, 1, 0xff0000);
            scene.add(arrow);

            const v = this.speed.clone(); // copy the speed
            const slide = v.sub(groundNormal.clone().multiplyScalar(v.dot(groundNormal)));
            this.speed.copy(slide);

            // apply gravity along the slope
            // const g = new THREE.Vector3(0, -9.81, 0).multiplyScalar(delta);
            // const slideGravity = g.sub(groundNormal.clone().multiplyScalar(g.dot(groundNormal)));
            // this.speed.add(slideGravity);
            
            this.isOnGround = true;
        } else {
            this.isOnGround = false;
        }

        // friction
        const groundFriction = 0.9;
        const airFriction = 0.99;

        if (this.isOnGround) {
            this.speed.x *= groundFriction;
            this.speed.z *= groundFriction;
        } else {
            this.speed.x *= airFriction;
            this.speed.z *= airFriction;
        }
    }

    getRubberMesh() {
        return this.rubberMesh;
    }
}

