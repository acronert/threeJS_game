export function createInputManager(domElement) {
    const input = { forward:false, backward:false,
                    left:false, right:false,
                    up: false, down: false,
                    pitch_up:false, pitch_down: false,
                    yaw_left:false, yaw_right:false,
                    gyro: {
                        alpha:0, beta:0, gamma:0
                    }};

    //////////// DESKTOP ////////////
    // Keyboard
    document.addEventListener('keydown', e => {
        if(e.code==="KeyW") input.forward=true;
        if(e.code==="KeyS") input.backward=true;
        if(e.code==="KeyA") input.left=true;
        if(e.code==="KeyD") input.right=true;

        if(e.code==="KeyQ") input.up=true;
        if(e.code==="KeyE") input.down=true;

        if(e.code==="ArrowUp") input.pitch_up=true;
        if(e.code==="ArrowDown") input.pitch_down=true;
        if(e.code==="ArrowLeft") input.yaw_left=true;
        if(e.code==="ArrowRight") input.yaw_right=true;
        if(e.code==="ArrowRight") input.yaw_right=true;
    });
    
    document.addEventListener('keyup', e => {
        if(e.code==="KeyW") input.forward=false;
        if(e.code==="KeyS") input.backward=false;
        if(e.code==="KeyA") input.left=false;
        if(e.code==="KeyD") input.right=false;

        if(e.code==="KeyQ") input.up=false;
        if(e.code==="KeyE") input.down=false;

        if(e.code==="ArrowUp") input.pitch_up=false;
        if(e.code==="ArrowDown") input.pitch_down=false;
        if(e.code==="ArrowLeft") input.yaw_left=false;
        if(e.code==="ArrowRight") input.yaw_right=false;
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

        input.gyro.alpha -= e.movementX * sensitivity;
        input.gyro.beta -= e.movementY * sensitivity;
        input.gyro.gamma = 0;
    });

    //////////// MOBILE ////////////
    // Touch
    domElement.addEventListener("touchstart", (e) => {
        const rect = domElement.getBoundingClientRect();  // get canvas size
        const touch = e.touches[0];

        if (touch.clientX < rect.width / 4)             input.yaw_left = true;
        else if (touch.clientX > 3 * rect.width / 4)    input.yaw_right = true;
        else if (touch.clientY > 3 * rect.height / 4)   input.backward = true;
        else                                            input.forward = true;
    });

    domElement.addEventListener("touchend", () => {
        input.forward = false;
        input.backward = false;
        input.yaw_left = false;
        input.yaw_right = false;
    });

    window.addEventListener("touchcancel", () => {
        input.forward = false;
        input.backward = false;
        input.yaw_left = false;
        input.yaw_right = false;
    });

    // Gyroscope
    const degToRad = Math.PI / 180;
    window.addEventListener("deviceorientation", (event) => {
        input.gyro.alpha = (event.alpha ?? 0) * degToRad; // z rotation
        input.gyro.beta  = (event.beta  ?? 0) * degToRad; // x rotation
        input.gyro.gamma = (event.gamma ?? 0) * degToRad; // y rotation
    });

    return { input };
}