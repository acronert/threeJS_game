
export class AVehicule {
  constructor(camera, scene, chunkManager) {
    this.camera = camera;
    this.scene = scene;
    this.chunkManager = chunkManager;

    this.mesh = null;

    this.position;
    this.direction;
    this.heading;
    this.spin;
    this.speed;
    this.acceleration;
    this.isOnGround;

    // Parameters
    this.steerSpeed;
    this.acc;
    this.friction;
    this.driftFactor;
    this.bounceFactor;
    this.gravity;
  }

  getPosition() {
    return this.position.clone();
  }

  updateCamera() {
    // abstract
  }

  applySteering(controls, delta) {
    if (controls && controls.left)
      this.heading += this.steerSpeed * delta;
    if (controls && controls.right)
      this.heading -= this.steerSpeed * delta;
    // roll steering
    if (controls) {
      const rollRad = getRollRelativeToForward(controls.orientationQuat);
      const roll = Math.min(1, Math.max(-1, rollRad)); // clamp to [-1, 1]
      this.heading += this.steerSpeed * delta * roll;
    }
  }

  getGroundNormal() {
    const n = getNormalAt(this.position.x, this.position.z, 0.25, this.chunkManager.getHeightAt);
    return new THREE.Vector3(n.x, n.z, n.y); // z up
  }

  // updateRotation(delta) {
  //   // Spin
  //   const forwardSpeed = this.speed.dot(this.direction);
  //   const distance = forwardSpeed * delta;
  //   const deltaRot = distance / this.rubberRadius;
  //   this.spin += deltaRot;
  //   const spinQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.spin);

  //   // Yaw
  //   const headingQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.heading);

  //   this.mesh.quaternion.copy(headingQuat).multiply(spinQuat);
  // }

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

  // applyBounce(groundNormal) {
  //   // Only bounce when going down
  //   if (this.speed.y < 0) {
  //     // Separate speed along ground normal (upward) from speed along the plane
  //     const velNormal = this.speed.clone().projectOnVector(groundNormal);
  //     const velPlane = this.speed.clone().projectOnPlane(groundNormal);
  //     velNormal.multiplyScalar(-this.bounceFactor);    // bounce along ground normal
  //     this.speed.copy(velPlane).add(velNormal);   // restore speed
  //     // small bounce threshold to avoid infinite bounces
  //     if (Math.abs(this.speed.y) < 0.5)
  //       this.speed.y = 0;
  //   }
  // }

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
    return this.mesh;
  }
}

export class Wheel extends AVehicule {
  constructor() {

  }
}