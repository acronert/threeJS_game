import * as THREE from "https://unpkg.com/three@0.164.1/build/three.module.js";

export function createCameraControls(camera, domElement) {
  // Movement state
  const keys = { forward:false, backward:false, left:false, right:false };
  let yaw = 0, pitch = 0;
  const speed = 0.05;

  // --- Desktop Keyboard ---
  document.addEventListener('keydown', e => {
    if(e.code==="KeyW") keys.forward=true;
    if(e.code==="KeyS") keys.backward=true;
    if(e.code==="KeyA") keys.left=true;
    if(e.code==="KeyD") keys.right=true;
  });
  document.addEventListener('keyup', e => {
    if(e.code==="KeyW") keys.forward=false;
    if(e.code==="KeyS") keys.backward=false;
    if(e.code==="KeyA") keys.left=false;
    if(e.code==="KeyD") keys.right=false;
  });

  // --- Desktop Mouse ---
  if (!('ontouchstart' in window)) {
    domElement.addEventListener('mousemove', e => {
      const sensitivity = 0.002;
      yaw   -= e.movementX * sensitivity;
      pitch -= e.movementY * sensitivity;
      pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch));
    });

    domElement.addEventListener('click', () => domElement.requestPointerLock());
  }

  // --- Mobile Touch ---
  let touchStartX = 0, touchStartY = 0;
  domElement.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  });
  domElement.addEventListener('touchmove', e => {
    const deltaX = e.touches[0].clientX - touchStartX;
    const deltaY = e.touches[0].clientY - touchStartY;
    const sensitivity = 0.002;
    yaw   -= deltaX * sensitivity;
    pitch -= deltaY * sensitivity;
    pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch));
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  });

  // --- Optional: Device Orientation ---
  if ('DeviceOrientationEvent' in window) {
    window.addEventListener('deviceorientation', e => {
      // Only use alpha/beta for horizontal/vertical rotation
      // Adjust as needed depending on device orientation
      // yaw = THREE.MathUtils.degToRad(e.alpha || 0);
      // pitch = THREE.MathUtils.degToRad(e.beta || 0) - Math.PI/2;
    });
  }

  // Update function (call in animate loop)
    function update() {
        // Direction the camera is looking in the XZ plane
        const direction = new THREE.Vector3(
            -Math.sin(yaw), // flip sign for correct forward/back
            0,
            -Math.cos(yaw)  // flip sign for correct forward/back
        ).normalize();

        const right = new THREE.Vector3().crossVectors(direction, new THREE.Vector3(0,1,0)).normalize();

        if(keys.forward)  camera.position.addScaledVector(direction, speed);
        if(keys.backward) camera.position.addScaledVector(direction, -speed);
        if(keys.left)     camera.position.addScaledVector(right, -speed);
        if(keys.right)    camera.position.addScaledVector(right, speed);

        // camera.rotation.set(pitch, yaw, 0);
    }


  return { update };
}
