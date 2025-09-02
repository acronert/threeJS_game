import * as THREE from "three";

export function createInputManager(domElement) {
    const keys = { forward:false, backward:false, left:false, right:false };
    const gyro = { alpha:0, beta:0, gamma:0 };

    // Touch
    domElement.addEventListener("touchstart", (e) => {
        const rect = domElement.getBoundingClientRect();  // get canvas size
        const touch = e.touches[0];

        if (touch.clientX < rect.width / 4)             keys.left = true;
        else if (touch.clientX > 3 * rect.width / 4)    keys.right = true;
        else if (touch.clientY > 3 * rect.height / 4)   keys.backward = true;
        else                                            keys.forward = true;
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

    // Gyroscope
    const degToRad = Math.PI / 180;
    window.addEventListener("deviceorientation", (event) => {
        gyro.alpha = (event.alpha ?? 0) * degToRad; // z rotation
        gyro.beta  = (event.beta  ?? 0) * degToRad; // x rotation
        gyro.gamma = (event.gamma ?? 0) * degToRad; // y rotation
    });

    return { keys, gyro };
}