import * as THREE from "three";

export function createCameraControls(camera, domElement) {
  // Movement state
  const keys = { forward:false, backward:false, left:false, right:false,
                  up: false, down: false,
                  pitch_up:false, pitch_down: false, yaw_left:false, yaw_right:false };

  let yaw = 0, pitch = 0;
  const speed = 0.06;
  const rotation_speed = 0.03; // in radians



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
