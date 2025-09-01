import * as THREE from "https://unpkg.com/three@0.164.1/build/three.module.js";

export function createCameraControls(camera, domElement) {
  // Movement state
  const keys = { forward:false, backward:false, left:false, right:false,
                  up: false, down: false,
                  pitch_up:false, pitch_down: false, yaw_left:false, yaw_right:false };

  let yaw = 0, pitch = 0;
  const speed = 0.06;
  const rotation_speed = 0.03; // in radians

  // Keyboard
  document.addEventListener('keydown', e => {
    //   if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
    // e.preventDefault(); // stop page from scrolling
    // }

    if(e.code==="KeyW") keys.forward=true;
    if(e.code==="KeyS") keys.backward=true;
    if(e.code==="KeyA") keys.left=true;
    if(e.code==="KeyD") keys.right=true;

    if(e.code==="KeyQ") keys.up=true;
    if(e.code==="KeyE") keys.down=true;

    if(e.code==="ArrowUp") keys.pitch_up=true;
    if(e.code==="ArrowDown") keys.pitch_down=true;
    if(e.code==="ArrowLeft") keys.yaw_left=true;
    if(e.code==="ArrowRight") keys.yaw_right=true;
    if(e.code==="ArrowRight") keys.yaw_right=true;
  });
  document.addEventListener('keyup', e => {
    if(e.code==="KeyW") keys.forward=false;
    if(e.code==="KeyS") keys.backward=false;
    if(e.code==="KeyA") keys.left=false;
    if(e.code==="KeyD") keys.right=false;

    if(e.code==="KeyQ") keys.up=false;
    if(e.code==="KeyE") keys.down=false;

    if(e.code==="ArrowUp") keys.pitch_up=false;
    if(e.code==="ArrowDown") keys.pitch_down=false;
    if(e.code==="ArrowLeft") keys.yaw_left=false;
    if(e.code==="ArrowRight") keys.yaw_right=false;
  });

  // Update function (call in animate loop)
    function update() {
      if(keys.pitch_up)   pitch += rotation_speed;
      if(keys.pitch_down) pitch -= rotation_speed;
      if(keys.yaw_left)   yaw += rotation_speed;
      if(keys.yaw_right)  yaw -= rotation_speed;

      // clamp rotation
      pitch = Math.max(Math.min(pitch, Math.PI / 2), -Math.PI / 2);

      camera.rotation.order = "YXZ";
      camera.rotation.set(pitch, yaw, 0);

      // Direction the camera is looking in the XZ plane
      const direction = new THREE.Vector3(
          -Math.sin(yaw), // flip sign for correct forward/back
          0,
          -Math.cos(yaw)  // flip sign for correct forward/back
      ).normalize();

      const right = new THREE.Vector3().crossVectors(direction, new THREE.Vector3(0,1,0)).normalize();

      const up = new THREE.Vector3(0, 1, 0);


      if(keys.forward)  camera.position.addScaledVector(direction, speed);
      if(keys.backward) camera.position.addScaledVector(direction, -speed);
      if(keys.left)     camera.position.addScaledVector(right, -speed);
      if(keys.right)    camera.position.addScaledVector(right, speed);

      if(keys.up)    camera.position.addScaledVector(up, speed);
      if(keys.down)    camera.position.addScaledVector(up, -speed);
    }


  return { update };
}
