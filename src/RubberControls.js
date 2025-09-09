export function createRubberControls() {
    const keys = { forward:false, backward:false,
                    steer_left:false, steer_right:false };

    // Keyboard
    document.addEventListener('keydown', e => {
        if(e.code==="KeyI") keys.forward=true;
        if(e.code==="KeyK") keys.backward=true;
        if(e.code==="KeyJ") keys.steer_left=true;
        if(e.code==="KeyL") keys.steer_right=true;
    });
    
    document.addEventListener('keyup', e => {
        if(e.code==="KeyI") keys.forward=false;
        if(e.code==="KeyK") keys.backward=false;
        if(e.code==="KeyJ") keys.steer_left=false;
        if(e.code==="KeyL") keys.steer_right=false;
    });

    return keys;
}
