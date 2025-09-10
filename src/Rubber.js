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



export class Rubber {
    constructor() {
        this.rubberRadius = 0.55;

        this.rubberMesh = createRubberMesh(this.rubberRadius);
        this.rubberControls = createRubberControls();

        this.position = this.rubberMesh.position;
        this.direction = new THREE.Vector3();
        this.heading = 0;

        this.speed = new THREE.Vector3();
        this.acceleration = new THREE.Vector3();
        this.isOnGround = true;
    }

    update(delta) {

        const steerSpeed = 3.0; // in rad/sec
        const acc = 10.0; // acceleration
        const friction = 0.99;
        const driftFactor = 0.6;
        const bounceFactor = 0.3;

        const gravity = new THREE.Vector3(0, -9.81, 0);


        // Steering
        if (this.rubberControls.steer_left)
            this.heading += steerSpeed * delta;
        if (this.rubberControls.steer_right)
            this.heading -= steerSpeed * delta;

        // Update Direction
        this.direction.set(
            Math.sin(this.heading),
            0,
            Math.cos(this.heading)
        );

        
        // Gravity
            // get terrain infos
        const groundHeight = getTerrainHeightAt(this.position.x, this.position.z) + this.rubberRadius;
        const n = getNormalAt(this.position.x, this.position.z, 0.25);
        const groundNormal = new THREE.Vector3(n.x, n.z, n.y); // invert z and y to put y up
            // Calculate next position
        const nextPos = this.position.clone().addScaledVector(this.speed, delta);

            // Check for collision
        if (nextPos.y <= groundHeight + 0.01) {
            this.isOnGround = true;
            // project gravity on the slope
            const slopeAccel = gravity.clone().projectOnPlane(groundNormal);
            // apply input acceleration
            if (this.rubberControls.forward)
                slopeAccel.add(this.direction.clone().multiplyScalar(acc));
            if (this.rubberControls.backward)
                slopeAccel.add(this.direction.clone().multiplyScalar(-acc));

            // update speed
            this.speed.addScaledVector(slopeAccel, delta);
            // Interpolate the direction and speed, to control direction + some drift
            const targetDir = this.direction.clone().normalize();
            const speedXZ = new THREE.Vector3(this.speed.x, 0, this.speed.z);
            speedXZ.lerp(targetDir.multiplyScalar(speedXZ.length()), 1 - driftFactor);
            this.speed.x = speedXZ.x;
            this.speed.z = speedXZ.z;
            // apply friction
            this.speed.x *= friction;
            this.speed.z *= friction;

            // Bounce along groundNormal if hitting from above
            if (this.speed.y < 0) {
                const velNormal = this.speed.clone().projectOnVector(groundNormal); // speed along groundNormal
                const velPlane = this.speed.clone().projectOnPlane(groundNormal);   // speed along plane
                velNormal.multiplyScalar(-bounceFactor);    // bounce along ground normal
                this.speed.copy(velPlane).add(velNormal);   // add velPlane and velNormal
                // small bounce threshold to avoid infinite bounces
                if (Math.abs(this.speed.y) < 0.5)
                    this.speed.y = 0;
            }
            nextPos.y = groundHeight; // clamp to ground
        } else {
            this.isOnGround = false;
            // freefall
            this.speed.y += -9.81 * delta;
        }

        // Apply new position and rotation
        this.position.copy(nextPos);
        this.rubberMesh.rotation.y = this.heading;
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




    //         update(delta) {
    //     // GET TIRE HEADING
    //         // Get steering input
    //     if (this.rubberControls.steer_left) this.heading += steerSpeed * delta;
    //     if (this.rubberControls.steer_right) this.heading -= steerSpeed * delta;

    //     // CALCULATE TIRE ACCELERATION
    //         // Apply acceleration ( gravity + input controls)
    //     this.acceleration.set(0, -9.81, 0);
    //     if (this.isOnGround) {
    //         if (this.rubberControls.forward) this.acceleration.addScaledVector(this.direction, acc);
    //         if (this.rubberControls.backward) this.acceleration.addScaledVector(this.direction, -acc);``
    //     }

    //     // SET SPEED
    //         // Apply acceleration
    //     this.speed.addScaledVector(this.acceleration, delta);
    //         // Apply friction ( except on y )
    //     if (this.isOnGround) {
    //         this.speed.x *= friction;
    //         this.speed.z *= friction;
    //     }

    //     // CALCULATE TIRE DIRECTION (the effective tire direction)
    //     // if (this.isOnGround) {
    //         // if isOnGround -> the direction should align progressively with the heading, to allow some drifting
    //         // Method 1: Simple linear interpolation approach
    //         const alignmentRate = 0.95; // How quickly direction aligns with heading (0-1)
            
    //         // Calculate target direction from heading
    //         const targetDirection = new THREE.Vector3(
    //             Math.sin(this.heading),
    //             0,
    //             Math.cos(this.heading)
    //         );
            
    //         // Gradually align current direction with target direction
    //         this.direction.lerp(targetDirection, alignmentRate * delta);
    //         this.direction.normalize();
    
    //     // } else {
    //         // if not on ground -> the direction should not change

    //     // }

    //     //     // compute forward vector (tire direction)
    //     //     // horizontal component of velocity
    //     // let horizontalVel = this.speed.clone();
    //     // horizontalVel.y = 0;
    //     //     // freeroll influence
    //     // const freerollWeight = 0.25; // 0 = ignore velocity, 1 = full freeroll
    //     // if (horizontalVel.lengthSq() > 0.01) {
    //     //     // combine velocity direction and heading
    //     //     const headingDir = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading)).normalize();
    //     //     this.direction.copy(horizontalVel.normalize().multiplyScalar(freerollWeight)
    //     //                     .add(headingDir.multiplyScalar(1 - freerollWeight))
    //     //                     .normalize());
    //     // } else {
    //     //     // if almost stationary, just use heading
    //     //     this.direction.set(Math.sin(this.heading), 0, Math.cos(this.heading)).normalize();
    //     // }

        


    //     // CALCULATE POSITION
    //         // predict next pos 
    //     const nextPos = this.position.clone().addScaledVector(this.speed, delta);

    //         // get terrain infos
    //     const groundY = getTerrainHeightAt(this.position.x, this.position.z) + this.rubberRadius;
    //     const n = getNormalAt(this.position.x, this.position.z, 0.25);
    //     const groundNormal = new THREE.Vector3(n.x, n.z, n.y); // invert z and y to put y up
        
    //     // Check collision
    //     if (this.position.y < groundY) {
    //         nextPos.y = groundY; // snap to ground
    //         // split velocity into normal (into the ground) and tanget (along the ground)
    //         const v = this.speed.clone();
    //         const vNormalMag = v.dot(groundNormal);
    //         const vNormal = groundNormal.clone().multiplyScalar(vNormalMag);
    //         const vTangent = v.sub(vNormal);

    //         // BOUNCE
    //         // if going into the ground, bounce
    //         const restitution = 0.6; // bounciness
    //         if (vNormalMag < 0) {
    //             vNormal.multiplyScalar(-restitution);
    //         }

    //         // recombine the veclocities
    //         this.speed.copy(vTangent.add(vNormal));

    //         this.isOnGround = true;
    //     } else {
    //         this.isOnGround = false;
    //     }

    //     // calculate position from speed
    //     this.position.copy(nextPos);
    //     // apply rotation
    //     this.rubberMesh.rotation.y = this.heading;
    // }









    //     update(delta) {

    //     const steerSpeed = 3.0; // in rad/sec
    //     const acc = 10.0; // acceleration
    //     const friction = 0.99;
    //     const driftFactor = 0.4;
    //     const bounceFactor = 0.3;

    //     const nextPos = this.position.clone().addScaledVector(this.speed, delta);
    //     const groundHeight = getTerrainHeightAt(this.position.x, this.position.z) + this.rubberRadius;
    //     const n = getNormalAt(this.position.x, this.position.z, 0.25);
    //     const groundNormal = new THREE.Vector3(n.x, n.z, n.y); // invert z and y to put y up

    //     // Steering
    //     if (this.rubberControls.steer_left)
    //         this.heading += steerSpeed * delta;
    //     if (this.rubberControls.steer_right)
    //         this.heading -= steerSpeed * delta;

    //     // Update Direction
    //     this.direction.set(
    //         Math.sin(this.heading),
    //         0,
    //         Math.cos(this.heading)
    //     );

    //     // Interpolate the direction and speed, to control direction + some drift
    //     const targetDir = this.direction.clone().normalize();
    //     const speedXZ = new THREE.Vector3(this.speed.x, 0, this.speed.z);
    //     speedXZ.lerp(targetDir.multiplyScalar(speedXZ.length()), 1 - driftFactor);
    //     this.speed.x = speedXZ.x;
    //     this.speed.z = speedXZ.z;

    //     // ACCELERATION
    //         // Apply acceleration ( gravity + input controls)
    //     this.acceleration.set(0, -9.81, 0);
    //     if (this.isOnGround) {
    //         if (this.rubberControls.forward)
    //             this.acceleration.addScaledVector(this.direction, acc);
    //         if (this.rubberControls.backward)
    //             this.acceleration.addScaledVector(this.direction, -acc);``
    //     }

    //     // SPEED
    //     this.speed.addScaledVector(this.acceleration, delta);
    //         // Apply friction ( except on y )
    //     if (this.isOnGround) {
    //         this.speed.x *= friction;
    //         this.speed.z *= friction;
    //     }

    //     // CHECK FOR COLLISION
    //     this.isOnGround = nextPos.y <= groundHeight;

    //     // Clamp to ground
    //     if (this.isOnGround) {
    //         nextPos.y = groundHeight;
    //         console.log("isOnGround");
    //     }

    //     // APPLY NEW POSITION
    //     this.position.copy(nextPos);

    //     // APPLY ROTATION
    //     this.rubberMesh.rotation.y = this.heading;
    // }
