import * as THREE from "https://unpkg.com/three@0.164.1/build/three.module.js";

export function createGyroControls(camera, domElement) {

  let yaw = 0, pitch = 0, roll = 0;
  const speed = 0.06;
  const rotation_speed = 0.03; // in radians

    window.addEventListener("deviceorientation", (event) => {
    const degToRad = Math.PI / 180;
    yaw = (event.alpha ?? 0) * degToRad; // z-axis
    pitch = (event.beta  ?? 0) * degToRad; // x-axis
    roll = (event.gamma ?? 0) * degToRad; // y-axis
    console.log("yaw: " + yaw + ", pitch: " + pitch + " , roll: " + roll);
    
  });
  
  function update() {
    const euler = new THREE.Euler(pitch, yaw, -roll, 'ZYX');
    camera.setRotationFromEuler(euler);
    }

    return { update }
}

    //     // Display gyroscope data
    // const gyroDiv = document.getElementById("gyroData");

    // window.addEventListener("deviceorientation", (event) => {
    // const alpha = event.alpha?.toFixed(2) ?? 0; // z rotation
    // const beta  = event.beta?.toFixed(2) ?? 0;  // x tilt
    // const gamma = event.gamma?.toFixed(2) ?? 0; // y tilt
    // gyroDiv.innerHTML = `Alpha: ${alpha}<br>Beta: ${beta}<br>Gamma: ${gamma}`;

    // const degToRad = Math.PI / 180;
    // const alphaRad = (event.alpha ?? 0) * degToRad; // z-axis
    // const betaRad  = (event.beta  ?? 0) * degToRad; // x-axis
    // const gammaRad = (event.gamma ?? 0) * degToRad; // y-axis
    // console.log("x: " + betaRad + ", y: " + gammaRad + " , z: " + alphaRad);
    //     // Create quaternion from device orientation
    // const euler = new THREE.Euler(betaRad, alphaRad, -gammaRad, 'ZYX'); 
    // camera.setRotationFromEuler(euler);

    // });
