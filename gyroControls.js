import * as THREE from "https://unpkg.com/three@0.164.1/build/three.module.js";

export function createGyroControls(camera, domElement) {

  const degToRad = Math.PI / 180;
  const quaternion = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const screenTransform = new THREE.Quaternion();
  const worldTransform = new THREE.Quaternion();
  const tempQuaternion = new THREE.Quaternion();

  // On ajuste la rotation selon l'orientation du téléphone (portrait)
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
    const alpha = (event.alpha ?? 0) * degToRad; // z
    const beta  = (event.beta  ?? 0) * degToRad; // x
    const gamma = (event.gamma ?? 0) * degToRad; // y

    // On convertit l'orientation du téléphone en quaternion
    euler.set(beta, alpha, -gamma, "YXZ"); // ordre YXZ pour éviter gimbal lock
    quaternion.setFromEuler(euler);

    // On applique la transformation du monde et de l'écran
    screenTransform.copy(getScreenTransform());
    worldTransform.setFromAxisAngle(new THREE.Vector3(1,0,0), -Math.PI/2); // ajustement axe x
    tempQuaternion.copy(quaternion).multiply(worldTransform).multiply(screenTransform);

    camera.quaternion.copy(tempQuaternion);
  });

  
  let touch = false;
  const speed = 0.05;

  // Touch to walk
  domElement.addEventListener("touchstart", (e) => {
    touch = true;
  });

  domElement.addEventListener("touchend", (e) => {
    touch = false;
  });

  function update() {
    // forward direction in local space is (0, 0, -1)
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(camera.quaternion); // rotate with camera orientation
    direction.y = 0; // ignore vertical tilt, keep movement flat on ground
    direction.normalize();
    if (touch)  camera.position.addScaledVector(direction, speed);
  }
  
  return { update }
}
