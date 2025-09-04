import * as THREE from "three";

export function createInputManager(domElement) {
    const keys = { forward:false, backward:false, left:false, right:false,
                    up: false, down: false,
                    pitch_up:false, pitch_down: false, yaw_left:false, yaw_right:false };

    const gyro = { alpha:0, beta:0, gamma:0 };

    //////////// DESKTOP ////////////
    // Keyboard
    document.addEventListener('keydown', e => {
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

    // Mouse
        // get the pointer lock
    const canvas = document.querySelector("canvas");
    canvas.addEventListener("click", () => {
        canvas.requestPointerLock();
        console.log("click");
    });
    document.addEventListener('mousemove', e => {
        const sensitivity = 0.002;

        gyro.alpha -= e.movementX * sensitivity;
        gyro.beta -= e.movementY * sensitivity;
    });

    //////////// MOBILE ////////////
    // Touch
    domElement.addEventListener("touchstart", (e) => {
        const rect = domElement.getBoundingClientRect();  // get canvas size
        const touch = e.touches[0];

        if (touch.clientX < rect.width / 4)             keys.yaw_left = true;
        else if (touch.clientX > 3 * rect.width / 4)    keys.yaw_right = true;
        else if (touch.clientY > 3 * rect.height / 4)   keys.backward = true;
        else                                            keys.forward = true;
    });

    domElement.addEventListener("touchend", () => {
        keys.forward = false;
        keys.backward = false;
        keys.yaw_left = false;
        keys.yaw_right = false;
    });

    window.addEventListener("touchcancel", () => {
        keys.forward = false;
        keys.backward = false;
        keys.yaw_left = false;
        keys.yaw_right = false;
    });

    // Gyroscope
    const degToRad = Math.PI / 180;
    window.addEventListener("deviceorientation", (event) => {
        gyro.alpha = (event.alpha ?? 0) * degToRad; // z rotation
        gyro.beta  = (event.beta  ?? 0) * degToRad; // x rotation
        gyro.gamma = (event.gamma ?? 0) * degToRad; // y rotation
    });

    return { keys, gyro };
}