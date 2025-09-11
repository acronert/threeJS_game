import * as THREE from "three";

export class ControlManager {
    constructor(domElement) {
        this.input = this.createInput(domElement);
        this.controls = {
            forward:    this.input.forward,
            backward:   this.input.backward,
            left:       this.input.left,
            right:      this.input.right,
            up:         this.input.up,
            down:       this.input.down,
            pitch_up:   this.input.pitch_up,
            pitch_down: this.input.pitch_down,
            yaw_left:   this.input.yaw_left,
            yaw_right:  this.input.yaw_right,
            interact:   this.input.interact,
            orientationQuat: new THREE.Quaternion()
        }

        // settings
        this.yawOffset = 0;     // rad
        this.yawRotSpeed = 1.5; // rad/s
        this.slerpFactor = 0.35;

        // tmp objects
        this.euler = new THREE.Euler();
        this.tmpQuat = new THREE.Quaternion();
        this.worldTransform = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0), -Math.PI/2);
        this.screenTransform = new THREE.Quaternion();

        // precalculate
        this.screenTransforms = {
            portrait: new THREE.Quaternion(),
            landscape: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1), -Math.PI/2),
            rlandscape: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1), Math.PI/2),
            rportrait: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1), Math.PI),
        };
    }

    createInput(domElement) {
        const input = { forward:false, backward:false,
                        left:false, right:false,
                        up: false, down: false,
                        pitch_up:false, pitch_down: false,
                        yaw_left:false, yaw_right:false,
                        interact: false,
                        gyro: {
                            alpha:0, beta:0, gamma:0
                        }};
        //////////// DESKTOP ////////////
        // Keyboard
        document.addEventListener('keydown', e => {
            if(e.code==="KeyW")         input.forward=true;
            if(e.code==="KeyS")         input.backward=true;
            if(e.code==="KeyA")         input.left=true;
            if(e.code==="KeyD")         input.right=true;
            if(e.code==="KeyQ")         input.up=true;
            if(e.code==="KeyE")         input.down=true;
            if(e.code==="ArrowUp")      input.pitch_up=true;
            if(e.code==="ArrowDown")    input.pitch_down=true;
            if(e.code==="ArrowLeft")    input.yaw_left=true;
            if(e.code==="ArrowRight")   input.yaw_right=true;
            if(e.code==="ArrowRight")   input.yaw_right=true;
            if(e.code==="Space")        input.interact=true;
        });
        
        document.addEventListener('keyup', e => {
            if(e.code==="KeyW")         input.forward=false;
            if(e.code==="KeyS")         input.backward=false;
            if(e.code==="KeyA")         input.left=false;
            if(e.code==="KeyD")         input.right=false;
            if(e.code==="KeyQ")         input.up=false;
            if(e.code==="KeyE")         input.down=false;
            if(e.code==="ArrowUp")      input.pitch_up=false;
            if(e.code==="ArrowDown")    input.pitch_down=false;
            if(e.code==="ArrowLeft")    input.yaw_left=false;
            if(e.code==="ArrowRight")   input.yaw_right=false;
            if(e.code==="Space")        input.interact=false;
        });

        // Mouse
            // get the pointer lock
        // const canvas = document.querySelector("canvas");
        // canvas.addEventListener("click", () => {
        //     canvas.requestPointerLock();
        //     console.log("click");
        // });

        // document.addEventListener('mousemove', e => {
        //     const sensitivity = 0.002;
        //     input.gyro.alpha -= e.movementX * sensitivity;
        //     input.gyro.beta -= e.movementY * sensitivity;
        //     input.gyro.gamma = 0;
        // });

        //////////// MOBILE ////////////
        // Touch
        let lastTapTime = 0;
        const doubleTapThreshold = 300; // ms
        domElement.addEventListener("touchstart", (e) => {
            const currentTime = performance.now();
            const tapInterval = currentTime - lastTapTime;

            if (tapInterval < doubleTapThreshold) {
                input.interact = true;
                console.log("double tap");
            }
            lastTapTime = currentTime;

            const rect = domElement.getBoundingClientRect();  // get canvas size
            const touch = e.touches[0];
            if (touch.clientX < rect.width / 4)             input.yaw_left = true;
            else if (touch.clientX > 3 * rect.width / 4)    input.yaw_right = true;
            else if (touch.clientY > 3 * rect.height / 4)   input.backward = true;
            else                                            input.forward = true;
        });

        domElement.addEventListener("touchmove", (e) => {
            const rect = domElement.getBoundingClientRect();  // get canvas size
            const touch = e.touches[0];

            input.yaw_left = false;
            input.yaw_right = false;

            if (touch.clientX < rect.width / 4) {
                input.yaw_left = true;
            }
            else if (touch.clientX > 3 * rect.width / 4) {
                input.yaw_right = true;
            }
        });


        domElement.addEventListener("touchend", () => {
            input.forward = false;
            input.backward = false;
            input.yaw_left = false;
            input.yaw_right = false;
            input.interact = false;
        });

        window.addEventListener("touchcancel", () => {
            input.forward = false;
            input.backward = false;
            input.yaw_left = false;
            input.yaw_right = false;
            input.interact = false;
        });

        // Gyroscope
        const degToRad = Math.PI / 180;
        window.addEventListener("deviceorientation", (event) => {
            input.gyro.alpha = (event.alpha ?? 0) * degToRad; // z rotation
            input.gyro.beta  = (event.beta  ?? 0) * degToRad; // x rotation
            input.gyro.gamma = (event.gamma ?? 0) * degToRad; // y rotation
        });

        return input;
    }

    // Screen orientation
    getScreenTransform() {
        switch (window.orientation || 0) {
            case 0: return this.screenTransforms.portrait;
            case 90: return this.screenTransforms.landscape;
            case -90: return this.screenTransforms.rlandscape;
            case 180: return this.screenTransforms.rportrait;
            default:  return this.screenTransforms.portrait;
        }
    }

    update(delta) {
        this.controls.forward =    this.input.forward;
        this.controls.backward =   this.input.backward;
        this.controls.left =       this.input.left;
        this.controls.right =      this.input.right;
        this.controls.up =         this.input.up;
        this.controls.down =       this.input.down;
        this.controls.pitch_up =   this.input.pitch_up;
        this.controls.pitch_down = this.input.pitch_down;
        this.controls.yaw_left =   this.input.yaw_left;
        this.controls.yaw_right =  this.input.yaw_right;
        this.controls.interact =   this.input.interact;

        if (this.input.yaw_left)    this.yawOffset += this.yawRotSpeed * delta;
        if (this.input.yaw_right)   this.yawOffset -= this.yawRotSpeed * delta;
    
        this.euler.set(this.input.gyro.beta,
                this.input.gyro.alpha + this.yawOffset,
                -this.input.gyro.gamma,
                "YXZ"
            ); // YXZ to avoid gimbal lock
        this.tmpQuat.setFromEuler(this.euler)
            .multiply(this.worldTransform)
            .multiply(this.getScreenTransform())
        this.controls.orientationQuat.slerp(this.tmpQuat, this.slerpFactor);

        return this.controls;
    }
}

