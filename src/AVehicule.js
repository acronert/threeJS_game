import * as THREE from "three";
import { getNormalAt } from "./PerlinNoise.js";

function getRollRelativeToForward(quat) {
  const up = new THREE.Vector3(0, -1, 0).applyQuaternion(quat).normalize();
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(quat).normalize();
  // Project forward onto XZ (ignore pitch for roll reference)
  forward.y = 0;
  forward.normalize();
  // Right vector in XZ plane
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
  // Roll = angle between "up" and global up, around forward axis
  const projectedUp = new THREE.Vector3().crossVectors(forward, right).normalize();
  const dot = up.dot(projectedUp);
  const det = up.dot(right); // sign

  return Math.atan2(det, dot); // roll in radians
}

export class AVehicule {
  constructor(camera, scene, chunkManager) {
    this.camera = camera;
    this.scene = scene;
    this.chunkManager = chunkManager;

    this.mesh = null;

    this.position = null;
    this.orientation = new THREE.Quaternion();
    this.speed = new THREE.Vector3(0, 0, 0);
    this.acceleration = new THREE.Vector3(0, 0, 0);
    this.isOnGround = true;

    this.isSpinning = null; // axes of rotations
    this.spin = new THREE.Vector3(0, 0, 0);

    // Parameters
    this.rotationSpeed;
    this.acc;
    this.friction;
    this.driftFactor;
    this.bounceFactor;

    this.gravity = new THREE.Vector3(0, -9.81, 0);
    this.worldUp = new THREE.Vector3(0, 1, 0);
    this.worldForward = new THREE.Vector3(0, 0, 1);
    this.worldRight = new THREE.Vector3(1, 0, 0);
  }

  ////////// UTILS //////////
  getSpeed() {
    return this.speed.length();
  }

  getPosition() {
    return this.position.clone();
  }

  getMesh() {
    return this.mesh;
  }

  getGroundNormal() {
    const n = getNormalAt(this.position.x, this.position.z, 0.25, this.chunkManager.getHeightAt);
    return new THREE.Vector3(n.x, n.z, n.y); // invert z and y to put y up
  }

  ////////// CAMERA //////////
  updateCamera() {
    const offset = new THREE.Vector3(0, 2, 0);
    const forward = this.worldForward.clone().applyQuaternion(this.orientation);
    const targetPos = this.position.clone()
      .add(offset)
      .add(forward.clone().multiplyScalar(-4));
    const targetLookAt = this.position.clone()
      .add(forward.clone().multiplyScalar(5));

    this.camera.position.lerp(targetPos, 0.2);
    this.camera.lookAt(targetLookAt);
  }

  ////////// PHYSICS //////////

  spinMesh(delta) {

  }


  updateMesh(nextPos) {
    // Update Mesh
    this.mesh.quaternion.copy(this.orientation);
    this.mesh.position.copy(nextPos);
  }

  applyGroundInputRotations(delta, controls) {
    let yawAngle = 0; // angle to apply this frame

    if (controls && controls.left)
      yawAngle += this.rotationSpeed * delta;
    if (controls && controls.right)
      yawAngle -= this.rotationSpeed * delta;

    // roll steering
    if (controls && controls.isMobile) {
      const rollRad = getRollRelativeToForward(controls.orientationQuat);
      const roll = Math.min(1, Math.max(-1, rollRad)); // clamp to [-1, 1]
      yawAngle += this.rotationSpeed * delta * roll;
    }

    if (yawAngle != 0) {
      const yawQuat = new THREE.Quaternion().setFromAxisAngle(this.worldUp, yawAngle);
      this.orientation.multiply(yawQuat);
    }
  }


  applyGroundAcceleration(groundNormal, controls) {
    // Gravity (projected on terrain)
    this.acceleration.copy(this.gravity).projectOnPlane(groundNormal);

    // Input
    const forward = this.worldForward.clone().applyQuaternion(this.orientation);
    if (controls?.forward)
      this.acceleration.add(forward.multiplyScalar(this.acc));
    if (controls?.backward)
      this.acceleration.add(forward.multiplyScalar(-this.acc));
  }

  applyDrift() {
    // Interpolate the direction of the tire and direction of the speed to alow drift
    const forward = this.worldForward.clone().applyQuaternion(this.orientation);
    const speedXZ = new THREE.Vector3(this.speed.x, 0, this.speed.z);
    const forwardSpeed = speedXZ.dot(forward);
    forward.multiplyScalar(forwardSpeed);
    speedXZ.lerp(forward, 1 - this.driftFactor);

    this.speed.x = speedXZ.x;
    this.speed.z = speedXZ.z;
  }

  applyBounce(groundNormal) {
    // Separate speed along ground normal (upward) from speed along the plane
    const velNormal = this.speed.clone().projectOnVector(groundNormal);
    const velPlane = this.speed.clone().projectOnPlane(groundNormal);

    const relVel = this.speed.dot(groundNormal); // speed relative to the ground normal
    // Only bounce when significant normal speed downward
    if (relVel < -3.0) {
      velNormal.multiplyScalar(-this.bounceFactor);    // bounce along ground normal
      this.speed.copy(velPlane).add(velNormal);   // restore speed
    }
  }

  alignRotationToNormal(groundNormal) {
    // local axes
    const forward = this.worldForward.clone().applyQuaternion(this.orientation);
    const right = this.worldRight.clone().applyQuaternion(this.orientation);

    const up = groundNormal.clone().normalize();
    const newForward = forward.clone().projectOnPlane(up).normalize();
    const newRight = right.crossVectors(up, newForward).normalize();

    const matrix = new THREE.Matrix4().makeBasis(newRight, up, newForward);
    const quat = new THREE.Quaternion().setFromRotationMatrix(matrix);

    // slerp
    this.orientation.slerp(quat, 0.2);
    // this.orientation.setFromRotationMatrix(matrix);
  }

  applyFriction() {
    // apply friction on the xz plane
    // /!\ Friction should be scaled on delta /!\
    this.speed.x *= this.friction;
    this.speed.z *= this.friction;
  }

  handleGroundPhysics(delta, controls, groundNormal) {
    this.alignRotationToNormal(groundNormal);
    this.applyGroundAcceleration(groundNormal, controls);
    this.speed.addScaledVector(this.acceleration, delta); // update speed from acceleration
    this.applyDrift(delta);
    this.applyFriction();
    this.applyBounce(groundNormal);
  }

  handleAirPhysics(delta, controls) {
    this.speed.y += -9.81 * delta; // freefall
  }

  ////////// UPDATE //////////
  update(delta, controls) {
    this.applyGroundInputRotations(delta, controls);

    // Get terrain infos
    const nextPos = this.position.clone().addScaledVector(this.speed, delta);
    const groundHeight = this.chunkManager.getHeightAt(this.position.x, this.position.z) + (this.meshHeight / 2);
    const groundNormal = this.getGroundNormal();

    this.isOnGround = (nextPos.y <= groundHeight + 0.01);
    if (this.isOnGround) {
      this.handleGroundPhysics(delta, controls, groundNormal);
      nextPos.y = groundHeight; // clamp to ground
    } else {
      this.handleAirPhysics(delta, controls, groundNormal);
    }

    // this.position.copy(nextPos);

    this.updateMesh(nextPos, delta);
    this.spinMesh(delta);

    if (controls)
      this.updateCamera(controls);
  }

}


import { Tiretracks } from "./ATerrainDecal.js";
import { createRubberMesh } from "./RubberMesh.js";

export class Wheel extends AVehicule {
  constructor(camera, scene, chunkManager) {
    super(camera, scene, chunkManager);
    this.rotationSpeed = 3.0; // in rad/sec
    this.acc = 15.0; // acceleration
    this.friction = 0.990;
    this.driftFactor = 0.6;
    this.bounceFactor = 0.5;

    this.meshHeight = 1.10;
    this.mesh = createRubberMesh(this.meshHeight / 2)
    this.mesh.position.set(0, 15, 0);
    this.position = this.mesh.position;
    this.scene.add(this.mesh);

    this.decals = new Tiretracks(this.scene, this.chunkManager);
  }

  spinMesh(delta) {
    const forward = this.worldForward.clone().applyQuaternion(this.orientation);
    const forwardSpeed = this.speed.dot(forward);
    const deltaRot = forwardSpeed * delta / (this.meshHeight / 2);
    this.spin.x += deltaRot;
    const spinQuat = new THREE.Quaternion().setFromAxisAngle(this.worldRight, this.spin.x);

    this.mesh.quaternion.multiply(spinQuat);
  }

}

import { createBeachBallMesh } from "./BeachBallMesh.js";

export class Ball extends AVehicule {
  constructor(camera, scene, chunkManager) {
    super(camera, scene, chunkManager);
    this.rotationSpeed = 3.0; // in rad/sec
    this.acc = 8.0; // acceleration
    this.friction = 0.995;
    this.driftFactor = 1.0;
    this.bounceFactor = 0.75;

    this.meshHeight = 1.5;


    this.mesh = createBeachBallMesh(this.meshHeight / 2);
    this.mesh.position.set(0, 15, 0);
    this.position = this.mesh.position;
    this.scene.add(this.mesh);

    // this.decals = new Tiretracks(this.scene, this.chunkManager);
  }

  spinMesh(delta) {
    const forward = this.worldForward.clone().applyQuaternion(this.orientation);
    const forwardSpeed = this.speed.dot(forward);
    const deltaRotX = forwardSpeed * delta / (this.meshHeight / 2);
    this.spin.x += deltaRotX;
    const quatX = new THREE.Quaternion().setFromAxisAngle(this.worldRight, this.spin.x);

    const right = this.worldRight.clone().applyQuaternion(this.orientation);
    const rightSpeed = this.speed.dot(right);
    const deltaRotZ = rightSpeed * delta / (this.meshHeight / 2);
    this.spin.z -= deltaRotZ;
    const quatZ = new THREE.Quaternion().setFromAxisAngle(this.worldForward, this.spin.z);

    this.mesh.quaternion.multiply(quatX);
    this.mesh.quaternion.multiply(quatZ);
  }


}

import { createSnowBoardMesh } from "./SnowBoardMesh.js";


export class SnowBoard extends AVehicule {
  constructor(camera, scene, chunkManager) {
    super(camera, scene, chunkManager);
    this.rotationSpeed = 3.0; // in rad/sec
    this.acc = 5.0; // acceleration
    this.friction = 0.995;
    this.driftFactor = 0.95;
    this.bounceFactor = 0.0;
    this.heading = 0;

    this.meshHeight = 0.30;
    this.mesh = createSnowBoardMesh()
    this.mesh.position.set(0, 2, 0);
    this.position = this.mesh.position;
    this.scene.add(this.mesh);

    // this.tiretracks = new Tiretracks(this.scene, this.chunkManager);
  }




}




// PLANE PHYSICS

//            ^ L
//            |
//           __
//           \  \     _ _
//            \**\ ___\/ \
//   F <-   X*#####*+^^\_\  -> D
//            o/\  \
//               \__\
//            |
//            V G

// F: Thrust -> acceleration of the plane
// D: Drag  -> dragCoef * v.length()
// L: Lift -> perpendicular to the wings, coaef * v**2 * wing area
// G: Gravity, -9.81
import { createDeltaPlaneMesh } from "./DeltaPlaneMesh.js";

export class Plane extends AVehicule {
  constructor(camera, scene, chunkManager) {
    super(camera, scene, chunkManager);
    this.rotationSpeed = 1.0; // in rad/sec
    this.acc = 10.0; // acceleration
    this.friction = 0.990;
    this.driftFactor = 0.6;
    this.bounceFactor = 0.0;

    this.meshHeight = 2;
    this.mesh = createDeltaPlaneMesh();
    this.mesh.position.set(5, 300, 5);
    this.position = this.mesh.position;
    this.scene.add(this.mesh);

    this.decals = new Tiretracks(this.scene, this.chunkManager);

    // Type	      mass(kg)	S (m²)	CL (typ)	CD (typ)	A (m²)	liftCoef (accel/m²)	dragCoef
    // Deltaplane	120	      15	    1.0	      0.05	    1.0	    0.0766	            0.000255
    // LightSport	300	      12	    1.0	      0.04	    1.0	    0.0245	            0.0000817
    // Smallprop	1000	    16	    1.0	      0.03	    1.5	    0.0098	            0.0000276

    // Plane specific

    // LIFT CALCULATION
    // liftAcceleration = liftForce * forwardVelocity**2
    // where:
    //    liftForce = 0.5 * airDensity * wingArea * liftCoef / mass;
    this.rho = 1.225;  // Air density (kg/m**3) : 1.225  at sea level;
    this.S = 15.0;     // Wing area (m**2)
    this.C_L = 0.3;    // Lift coefficent (dimensionless): 0.5->1.5 depending on area of attack
    this.mass = 120;   // (kg)

    this.liftCoef = 0.5 * this.rho * this.S * this.C_L / this.mass;

    // DRAG CALCULATION
    // dragAcceleration = -dragCoef * v * |v|
    // where:
    // dragForce = 0.5 * airDensity * dragCoef * referenceArea / mass
    this.A = 1.0;     // Reference area 
    this.C_D = 0.05;  // Drag coefficient

    this.dragCoef = 0.5 * this.rho * this.C_D * this.A / this.mass;

    // THRUST CALCULATION
    this.thrust = 10.0; // m/s**2
    this.thrustForce = this.thrust / this.mass;

    // DEBUG
    this.redArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      this.position,
      5,
      0xff0000
    );
    this.scene.add(this.redArrow);

    this.greenArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      this.position,
      5,
      0x00ff00
    );
    this.scene.add(this.greenArrow);

    this.blueArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      this.position,
      5,
      0x0000ff
    );
    this.scene.add(this.blueArrow);

    this.magentaArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      this.position,
      5,
      0xff00ff
    );
    this.scene.add(this.magentaArrow);

    this.yellowArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      this.position,
      5,
      0xffff00
    );
    this.scene.add(this.yellowArrow);

  }

  getAirInputRotations(delta, controls) {
    // KEYBOARD
    if (controls?.isMobile == false) {
      if (controls?.pitch_up) {
        const q = new THREE.Quaternion().setFromAxisAngle(this.worldRight, -this.rotationSpeed * delta);
        this.orientation.multiply(q);
      }
      if (controls?.pitch_down) {
        const q = new THREE.Quaternion().setFromAxisAngle(this.worldRight, this.rotationSpeed * delta);
        this.orientation.multiply(q);
      }
      if (controls?.yaw_left) {
        const q = new THREE.Quaternion().setFromAxisAngle(this.worldForward, -this.rotationSpeed * delta);
        this.orientation.multiply(q);
      }
      if (controls?.yaw_right) {
        const q = new THREE.Quaternion().setFromAxisAngle(this.worldForward, this.rotationSpeed * delta);
        this.orientation.multiply(q);
      }
    }
    // MOBILE
    else if (controls?.isMobile == true) {
      const phoneQuat = controls.orientationQuat.clone();
      const euler = new THREE.Euler().setFromQuaternion(phoneQuat, 'YXZ');
      const currentEuler = new THREE.Euler().setFromQuaternion(this.orientation, 'YXZ');
      currentEuler.x = -euler.x; // pitch from phone
      currentEuler.z = -euler.z; // roll from phone
      this.orientation.setFromEuler(currentEuler);
    }
  }

  updateCamera() {
    const cameraPosOffset = new THREE.Vector3(0, 0, -2).clone().applyQuaternion(this.orientation);
    const cameraPos = this.position.clone().add(cameraPosOffset);

    this.camera.position.copy(cameraPos);
    this.camera.lookAt(this.position);
  }

  // updateCamera() {
  //   const offset = new THREE.Vector3(3, 3, 3);
  //   const forward = this.worldForward.clone().applyQuaternion(this.orientation);
  //   const cameraPos = this.position.clone()
  //     .add(offset)
  //     .add(forward.clone().multiplyScalar(-4));
  //   const cameraTarget = this.position.clone()
  //   // .add(forward.clone().multiplyScalar(5));

  //   this.camera.position.copy(cameraPos);
  //   this.camera.lookAt(cameraTarget);
  // }

  applyAirRotation(delta) {
    const forward = this.worldForward.clone().applyQuaternion(this.orientation).normalize();
    const vForward = forward.clone().multiplyScalar(this.speed.dot(forward));
    const vLateral = this.speed.clone().sub(vForward);

    // lateral drift
    this.speed.copy(vForward.addScaledVector(vLateral, 0.98));
  }

  handleAirPhysics(delta, controls) {
    // Gravity
    this.acceleration.copy(this.gravity);

    this.magentaArrow.position.copy(this.position);
    this.magentaArrow.setDirection(this.gravity.clone().normalize());
    this.magentaArrow.setLength(this.gravity.length());



    // get Rotation Input (roll and pitch)
    this.getAirInputRotations(delta, controls);
    // make the speed follow the direction
    this.applyAirRotation();

    const forward = this.worldForward.clone().applyQuaternion(this.orientation).normalize();


    // Thrust
    let thrustForce = new THREE.Vector3(0, 0, 0);
    if (controls?.forward)
      thrustForce = forward.clone().multiplyScalar(this.thrust);
    if (controls?.backward)
      thrustForce = forward.clone().multiplyScalar(-this.thrust * 0.5);

    this.blueArrow.position.copy(this.position);
    this.blueArrow.setDirection(thrustForce.clone().normalize());
    this.blueArrow.setLength(thrustForce.length());

    this.acceleration.add(thrustForce);

    // Drag
    const v = this.speed.length();
    const dragAccel = this.speed.clone().multiplyScalar(-this.dragCoef * v * Math.abs(v));
    this.redArrow.position.copy(this.position);
    this.redArrow.setDirection(dragAccel.clone().normalize());
    this.redArrow.setLength(dragAccel.length());
    this.acceleration.add(dragAccel);


    // Lift
    const vForward = Math.max(0, this.speed.dot(forward));
    const liftAccel = this.liftCoef * vForward ** 2;
    const up = this.worldUp.clone().applyQuaternion(this.orientation).normalize();

    // Update arrow helper to show lift/up direction
    this.greenArrow.position.copy(this.position);
    this.greenArrow.setDirection(up.clone().normalize());
    this.greenArrow.setLength(liftAccel);

    this.acceleration.add(up.multiplyScalar(liftAccel));

    this.yellowArrow.position.copy(this.position);
    this.yellowArrow.setDirection(this.acceleration.clone().normalize());
    this.yellowArrow.setLength(this.acceleration.length());

    // Add to speed
    this.speed.addScaledVector(this.acceleration, delta);

    // Only if acceleration is significant
    if (this.acceleration.lengthSq() > 0.0001) {
      const accelDir = this.acceleration.clone().normalize(); // target direction

      // Project acceleration onto plane's horizontal plane (ignore Y for pitch)
      const accelDirHorizontal = accelDir.clone();
      accelDirHorizontal.y = 0;
      accelDirHorizontal.normalize();

      // Current forward in world XZ plane
      const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.orientation);
      const forwardHorizontal = forward.clone();
      forwardHorizontal.y = 0;
      forwardHorizontal.normalize();

      // Compute angle difference around Y axis (yaw)
      const targetYaw = Math.atan2(accelDirHorizontal.x, accelDirHorizontal.z);   // desired yaw
      const currentYaw = Math.atan2(forwardHorizontal.x, forwardHorizontal.z);    // current yaw
      let yawDelta = targetYaw - currentYaw;

      // Wrap angle to [-PI, PI]
      if (yawDelta > Math.PI) yawDelta -= 2 * Math.PI;
      if (yawDelta < -Math.PI) yawDelta += 2 * Math.PI;

      // Rotate around local up axis (Y) only
      const qYaw = new THREE.Quaternion();
      qYaw.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yawDelta * 0.01); // 0.1 = responsiveness
      this.orientation.multiply(qYaw);
    }


  }

  // block position
  // updateMesh(nextPos) {
  //   this.mesh.quaternion.copy(this.orientation);
  // }


}