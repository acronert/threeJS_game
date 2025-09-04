import * as THREE from "three";

export function createControls(camera, inputManager) {
  const quaternion = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const screenTransform = new THREE.Quaternion();
  const worldTransform = new THREE.Quaternion();
  const tempQuaternion = new THREE.Quaternion();
  
  let yawOffset = 0;
  const speed = 0.1;
  const rotSpeed = 0.02;

  // // Check if user on mobile or desktop
  // let userIsMobile = 0;
  // if (navigator.userAgentData) {
  //   userIsMobile = navigator.userAgentData.mobile;
  // }


  // Screen orientation
  function getScreenTransform() {
    switch (window.orientation || 0) {
      case 0: return new THREE.Quaternion(); // portrait
      case 90: return new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1), -Math.PI/2);
      case -90: return new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1), Math.PI/2);
      case 180: return new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1), Math.PI);
      default: return new THREE.Quaternion();
    }
  }

  function update() {
    // Move
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    forward.y = 0; // keep movement on ground plane
    forward.normalize();

    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    right.y = 0; // keep horizontal
    right.normalize();

    const up = new THREE.Vector3(0, 1, 0); // world up, or rotate with camera if you prefer
  
    if (inputManager.keys.forward)   camera.position.addScaledVector(forward, speed);
    if (inputManager.keys.backward)  camera.position.addScaledVector(forward, -speed);
    if (inputManager.keys.right)   camera.position.addScaledVector(right, speed);
    if (inputManager.keys.left)  camera.position.addScaledVector(right, -speed);
    if (inputManager.keys.up)   camera.position.addScaledVector(up, speed);
    if (inputManager.keys.down)  camera.position.addScaledVector(up, -speed);

    // Rotations
    if (inputManager.keys.yaw_left)  yawOffset += rotSpeed;
    if (inputManager.keys.yaw_right)  yawOffset -= rotSpeed;
    euler.set(inputManager.gyro.beta,
              inputManager.gyro.alpha + yawOffset,
              -inputManager.gyro.gamma,
              "YXZ"); // YXZ to avoid gimbal lock
    quaternion.setFromEuler(euler); // phone gyro
    screenTransform.copy(getScreenTransform()); // correction according to phone orientation
    worldTransform.setFromAxisAngle(new THREE.Vector3(1,0,0), -Math.PI/2); // x correction to look forward instead of down

    tempQuaternion.copy(quaternion).multiply(worldTransform).multiply(screenTransform);

    // slerping
    const slerpFactor = 0.35;
    camera.quaternion.slerp(tempQuaternion, slerpFactor);
  }
  
  return { update }
}