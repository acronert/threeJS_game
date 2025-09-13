import * as THREE from "three";
import { getNormalAt } from "./PerlinNoise.js";
import { Tiretracks } from "./ATerrainDecal.js";
import { createRubberMesh } from "./RubberMesh.js";

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

export class Rubber {
  constructor(camera, scene, chunkManager, x = 0, z = 0) {
    this.camera = camera;
    this.chunkManager = chunkManager;

    this.tiretracks = new Tiretracks(scene, chunkManager);

    this.rubberRadius = 0.55;
    this.rubberMesh = createRubberMesh(this.rubberRadius);
    this.rubberMesh.position.set(x, 0, z);

    this.position = this.rubberMesh.position;
    this.direction = new THREE.Vector3();
    this.heading = 0;
    this.spin = 0;
    this.speed = new THREE.Vector3(0, 0, 0);
    this.acceleration = new THREE.Vector3(0, 0, 0);
    this.isOnGround = true;

    // const params
    this.steerSpeed = 3.0; // in rad/sec
    this.acc = 10.0; // acceleration
    this.friction = 0.990;
    this.driftFactor = 0.6;
    this.bounceFactor = 0.5;
    this.gravity = new THREE.Vector3(0, -9.81, 0);

  }

  getPosition() {
    return this.position.clone();
  }

  updateCamera() {
    const offset = new THREE.Vector3(0, 2, 0);
    const targetPos = this.position.clone()
      .add(offset)
      .add(this.direction.clone().multiplyScalar(-4));
    const targetLookAt = this.position.clone()
      .add(this.direction.clone().multiplyScalar(5));

    this.camera.position.lerp(targetPos, 0.2);
    this.camera.lookAt(targetLookAt);
  }

  applySteering(controls, delta) {
    if (controls && controls.left)
      this.heading += this.steerSpeed * delta;
    if (controls && controls.right)
      this.heading -= this.steerSpeed * delta;
    // roll steering
    // if (controls) {
    //   const rollRad = getRollRelativeToForward(controls.orientationQuat);
    //   const roll = Math.min(1, Math.max(-1, rollRad)); // clamp to [-1, 1]
    //   this.heading += this.steerSpeed * delta * roll;
    // }
  }

  getGroundNormal() {
    const n = getNormalAt(this.position.x, this.position.z, 0.25, this.chunkManager.getHeightAt);
    return new THREE.Vector3(n.x, n.z, n.y); // invert z and y to put y up
  }

  // rotate and spin the rubber
  updateRotation(delta) {
    const forwardSpeed = this.speed.dot(this.direction);

    const distance = forwardSpeed * delta;
    const deltaRot = distance / this.rubberRadius;
    this.spin += deltaRot;
    const spinQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.spin);

    const headingQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.heading);

    this.rubberMesh.quaternion.copy(headingQuat).multiply(spinQuat);
  }

  applyAcceleration(groundNormal, controls) {
    // Gravity (projected on terrain)
    this.acceleration = this.gravity.clone().projectOnPlane(groundNormal);

    // Input
    if (controls && controls.forward)
      this.acceleration.add(this.direction.clone().multiplyScalar(this.acc));
    if (controls && controls.backward)
      this.acceleration.add(this.direction.clone().multiplyScalar(-this.acc));
  }

  applyDirection() {
    // Interpolate the direction of the tire and direction of the speed to alow drift
    const forward = this.direction.clone().normalize();
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
    // Only bounce when significant normal speed downward
    if (this.speed.y < 0 && velNormal.length() > 2.0) {
      velNormal.multiplyScalar(-this.bounceFactor);    // bounce along ground normal
      this.speed.copy(velPlane).add(velNormal);   // restore speed
      // small bounce threshold to avoid infinite bounces
      if (Math.abs(this.speed.y) < 3.0)
        this.speed.y = 0;
    }
  }

  handleGroundPhysics(delta, controls, groundNormal) {
    this.applyAcceleration(groundNormal, controls);
    this.speed.addScaledVector(this.acceleration, delta); // update speed from acceleration
    this.applyDirection(delta);

    // apply friction on the xz plane
    // /!\ Friction should be scaled on delta /!\
    this.speed.x *= this.friction;
    this.speed.z *= this.friction;

    this.applyBounce(groundNormal);
  }

  handleAirPhysics(delta) {
    this.speed.y += -9.81 * delta; // freefall
  }

  update(delta, controls) {
    this.applySteering(controls, delta);
    this.direction.set(Math.sin(this.heading), 0, Math.cos(this.heading));

    const nextPos = this.position.clone().addScaledVector(this.speed, delta);
    const groundHeight = this.chunkManager.getHeightAt(this.position.x, this.position.z) + this.rubberRadius;
    const groundNormal = this.getGroundNormal();

    this.isOnGround = (nextPos.y <= groundHeight + 0.01);

    if (this.isOnGround) {
      this.handleGroundPhysics(delta, controls, groundNormal);
      nextPos.y = groundHeight; // clamp to ground
    } else {
      this.handleAirPhysics(delta);
    }

    this.position.copy(nextPos);
    this.updateRotation(delta);

    // if (this.isOnGround)
      // this.tiretracks.update(this.position.x, this.position.z, this.heading);

    if (controls)
      this.updateCamera(controls);
  }

  getRubberMesh() {
    return this.rubberMesh;
  }
}
