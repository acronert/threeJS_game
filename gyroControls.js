import * as THREE from "https://unpkg.com/three@0.164.1/build/three.module.js";

export function createGyroControls(camera, domElement) {

  const degToRad = Math.PI / 180;
  const quaternion = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const screenTransform = new THREE.Quaternion();
  const worldTransform = new THREE.Quaternion();
  const tempQuaternion = new THREE.Quaternion();
  
  const alpha = 0;
  const beta = 0;
  const gamma = 0;


  let yawOffset = 0;

  function getScreenTransform() {
    switch (window.orientation || 0) {
      case 0: return new THREE.Quaternion(); // portrait
      case 90: return new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1), -Math.PI/2);
      case -90: return new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1), Math.PI/2);
      case 180: return new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1), Math.PI);
      default: return new THREE.Quaternion();
    }
  }

  window.addEventListener("deviceorientation", (event) => {
    alpha = (event.alpha ?? 0) * degToRad; // z
    beta  = (event.beta  ?? 0) * degToRad; // x
    gamma = (event.gamma ?? 0) * degToRad; // y
  });

  
  const keys = { forward:false, backward:false, left:false, right:false };
  const speed = 0.05;
  const rotSpeed = 0.02;

  // Touch to walk
  domElement.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];

    const rect = domElement.getBoundingClientRect();  // display size
    console.log("width:", rect.width, "height:", rect.height);
    if (touch.clientX < rect.width / 4)   keys.left = true;
    else if (touch.clientX > 3 * rect.width / 4)   keys.right = true;
    else if (touch.clientY > 3 * rect.height / 4)  keys.backward = true;
    else    keys.forward = true;
  });

  domElement.addEventListener("touchend", () => {
    keys.forward = false;
    keys.backward = false;
    keys.left = false;
    keys.right = false;
  });

  window.addEventListener("touchcancel", () => {
    keys.forward = false;
    keys.backward = false;
    keys.left = false;
    keys.right = false;
  });

  function update() {
    // Translations
    // forward direction in local space is (0, 0, -1)
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(camera.quaternion);
    forward.y = 0; // keep movement on ground plane
    forward.normalize();

    if (keys.forward)  camera.position.addScaledVector(forward, speed);
    if (keys.backward)  camera.position.addScaledVector(forward, -speed);

    // Rotations

    euler.set(beta, alpha + yawOffset, -gamma, "YXZ"); // ordre YXZ pour éviter gimbal lock
    // phone gyro
    quaternion.setFromEuler(euler);

    // correction according to phone orientation
    screenTransform.copy(getScreenTransform());

    // x correction to look forward instead of down
    worldTransform.setFromAxisAngle(new THREE.Vector3(1,0,0), -Math.PI/2);

    tempQuaternion.copy(quaternion).multiply(worldTransform).multiply(screenTransform);

    camera.quaternion.copy(tempQuaternion);

    if (keys.left)  yawOffset += rotSpeed;
    if (keys.right)  yawOffset -= rotSpeed;
  }
  
  return { update }
}