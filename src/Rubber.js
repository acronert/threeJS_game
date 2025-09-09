import * as THREE from "three";
import { getNormalAt, getTerrainHeightAt } from "./PerlinNoise.js";
import { createRubberControls } from "./RubberControls.js";


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
        tubeMesh.castShadow = true;

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
        rimMesh.castShadow = true;

        // Assembly
        const rimMesh2 = rimMesh.clone();

        tubeMesh.position.z = -tubeWidth / 2;  // shifts tube from [-0.15, +0.15]
        rimMesh.position.z = tubeWidth / 2 - rimWidth; // front end of the tube
        rimMesh2.position.z = -tubeWidth / 2;          // back end of the tube

        rubberMesh.add(tubeMesh);
        rubberMesh.add(rimMesh);
        rubberMesh.add(rimMesh2);

        // test cube
        // const cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({color: 0xff0000}));
        // rubberMesh.add(cube);

        rubberMesh.castShadow = true;

        return rubberMesh;
    }

const steerSpeed = 3.0; // in rad/sec
const acc = 25.0; // acceleration
const friction = 0.95;

export class Rubber {
    constructor() {
        this.rubberRadius = 0.55;

        this.rubberMesh = createRubberMesh(this.rubberRadius);
        this.rubberControls = createRubberControls();

        this.position = this.rubberMesh.position;
        this.heading = 0; // orientation on the up axis, in radians
        this.forward = new THREE.Vector3(0, 0, 1); // local forward vector
        this.speed = new THREE.Vector3();
        this.acceleration = new THREE.Vector3();
        this.isOnGround = true;
    }



    update(delta) {
        // GET TIRE DIRECTION
            // Get steering input
        if (this.rubberControls.steer_left) this.heading += steerSpeed * delta;
        if (this.rubberControls.steer_right) this.heading -= steerSpeed * delta;

            // compute forward vector (tire direction)
            // horizontal component of velocity
        let horizontalVel = this.speed.clone();
        horizontalVel.y = 0;
            // freeroll influence
        const freerollWeight = 0.25; // 0 = ignore velocity, 1 = full freeroll
        if (horizontalVel.lengthSq() > 0.01) {
            // combine velocity direction and heading
            const headingDir = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading)).normalize();
            this.forward.copy(horizontalVel.normalize().multiplyScalar(freerollWeight)
                            .add(headingDir.multiplyScalar(1 - freerollWeight))
                            .normalize());
        } else {
            // if almost stationary, just use heading
            this.forward.set(Math.sin(this.heading), 0, Math.cos(this.heading)).normalize();
        }

        // CALCULATE TIRE ACCELERATION
        // Apply acceleration ( gravity + input controls)
        this.acceleration.set(0, -9.81, 0); // gravity
        if (this.isOnGround) {
            if (this.rubberControls.forward) this.acceleration.addScaledVector(this.forward, acc);
            if (this.rubberControls.backward) this.acceleration.addScaledVector(this.forward, -acc);``
        }
        
        // SET SPEED
            // Apply acceleration
        this.speed.addScaledVector(this.acceleration, delta);
            // Apply friction ( except on y )
        if (this.isOnGround) {
            this.speed.x *= friction;
            this.speed.z *= friction;
        }

        // CALCULATE POSITION
            // predict next pos 
        const nextPos = this.position.clone().addScaledVector(this.speed, delta);

            // get terrain infos
        const groundY = getTerrainHeightAt(this.position.x, this.position.z) + this.rubberRadius;
        const n = getNormalAt(this.position.x, this.position.z, 0.25);
        const groundNormal = new THREE.Vector3(n.x, n.z, n.y); // invert z and y to put y up
        
        // Check collision
        if (this.position.y < groundY) {
            nextPos.y = groundY; // snap to ground
            // split velocity into normal (into the ground) and tanget (along the ground)
            const v = this.speed.clone();
            const vNormalMag = v.dot(groundNormal);
            const vNormal = groundNormal.clone().multiplyScalar(vNormalMag);
            const vTangent = v.sub(vNormal);

            // BOUNCE
            // if going into the ground, bounce
            const restitution = 0.6; // bounciness
            if (vNormalMag < 0) {
                vNormal.multiplyScalar(-restitution);
            }

            // recombine the veclocities
            this.speed.copy(vTangent.add(vNormal));

            this.isOnGround = true;
        } else {
            this.isOnGround = false;
        }

        // calculate position from speed
        this.position.copy(nextPos);
        // apply rotation
        this.rubberMesh.rotation.y = this.heading + Math.PI / 2;
    }

    getRubberMesh() {
        return this.rubberMesh;
    }
}

        // // friction
        // const groundFriction = 0.99;
        // if (this.isOnGround) {
        //     this.speed.x *= groundFriction;
        //     this.speed.z *= groundFriction;


        //     // Bounce
        //     this.position.y = height + this.rubberRadius
        //     const bounce_restitution = 0.65;
        //     this.speed.y = -this.speed.y * bounce_restitution;
    
        //     // Slide
        //     const v = this.speed.clone(); // copy the speed
        //     const slide = v.sub(groundNormal.clone().multiplyScalar(v.dot(groundNormal)));
        //     this.speed.copy(slide);
        // }