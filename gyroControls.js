// import * as THREE from "https://unpkg.com/three@0.164.1/build/three.module.js";

// export function createGyroControls(camera, domElement) {

//   let yaw = 0, pitch = 0, roll = 0;
//   const speed = 0.06;
//   const rotation_speed = 0.03; // in radians

//     window.addEventListener("deviceorientation", (event) => {
//     const degToRad = Math.PI / 180;
//     yaw = (event.alpha ?? 0) * degToRad; // z-axis
//     pitch = (event.beta  ?? 0) * degToRad; // x-axis
//     roll = (event.gamma ?? 0) * degToRad; // y-axis
//     console.log("yaw: " + yaw + ", pitch: " + pitch + " , roll: " + roll);
    
//   });
  
//   function update() {
//     const euler = new THREE.Euler(pitch, yaw, -roll, 'ZYX');
//     camera.setRotationFromEuler(euler);
//     }

//     return { update }
// }

import * as THREE from "https://unpkg.com/three@0.164.1/build/three.module.js";

export function createGyroControls(camera, domElement) {

  let yaw = 0, pitch = 0, roll = 0;
  const degToRad = Math.PI / 180;

  window.addEventListener("deviceorientation", (event) => {
    yaw = (event.alpha ?? 0) * degToRad; // z-axis 0 to 360 degrees     yaw
    pitch  = (event.beta  ?? 0) * degToRad; // x-axis -180 to 180 degrees  pitch
    // roll = (event.gamma ?? 0) * degToRad; // y-axis -90 to 90 degrees    roll
    roll = 0;
  });


  function update() {
    const euler = new THREE.Euler(pitch - Math.PI / 2, yaw, roll, "XYZ");
    camera.setRotationFromEuler(euler);
    // camera.rotation.set(pitch - Math.PI / 2, yaw, roll);
  }

  return { update }
}
