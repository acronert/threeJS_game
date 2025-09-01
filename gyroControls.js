// // import * as THREE from "https://unpkg.com/three@0.164.1/build/three.module.js";

// // export function createGyroControls(camera, domElement) {

// //   let yaw = 0, pitch = 0, roll = 0;
// //   const speed = 0.06;
// //   const rotation_speed = 0.03; // in radians

// //     window.addEventListener("deviceorientation", (event) => {
// //     const degToRad = Math.PI / 180;
// //     yaw = (event.alpha ?? 0) * degToRad; // z-axis
// //     pitch = (event.beta  ?? 0) * degToRad; // x-axis
// //     roll = (event.gamma ?? 0) * degToRad; // y-axis
// //     console.log("yaw: " + yaw + ", pitch: " + pitch + " , roll: " + roll);
    
// //   });
  
// //   function update() {
// //     const euler = new THREE.Euler(pitch, yaw, -roll, 'ZYX');
// //     camera.setRotationFromEuler(euler);
// //     }

// //     return { update }
// // }

// import * as THREE from "https://unpkg.com/three@0.164.1/build/three.module.js";

// export function createGyroControls(camera, domElement) {

//   let yaw = 0, pitch = 0, roll = 0;
//   const degToRad = Math.PI / 180;

//   window.addEventListener("deviceorientation", (event) => {
//     yaw = (event.alpha ?? 0) * degToRad; // z-axis 0 to 360 degrees     yaw
//     pitch  = (event.beta  ?? 0) * degToRad; // x-axis -180 to 180 degrees  pitch
//     roll = (event.gamma ?? 0) * degToRad; // y-axis -90 to 90 degrees    roll
//   });


//   function update() {
//   }

//   return { update }
// }

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

  function update() {
    // Pas besoin de faire quelque chose ici, la caméra est déjà mise à jour dans l'event
  }

  return { update }
}
