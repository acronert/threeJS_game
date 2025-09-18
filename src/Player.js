// import { ChunkManager } from "./ChunkManager.js";
// import { Rubber } from "./Rubber.js";
// import { Walker } from "./Walker.js";
// import { Wheel } from "./AVehicule.js";
// import { SnowBoard } from "./AVehicule.js";
// import { Ball } from "./AVehicule.js";
// import { Plane } from "./AVehicule.js";


// export class Player {
//     constructor(camera, scene, world) {
//         this.camera = camera;
//         this.scene = scene;
//         this.world = world;

//         this.player = new Walker(this.camera, this.scene, this.world)
//     }

//     resetPosition() {
//         this.player.position.set(0, 0, 0);
//     }


//     setVehiculeType(type) {
//         const position = this.player.position.clone(); // keep last position
//         const oldHud = this.player.hud;
//         if (this.player.mesh) {
//             this.scene.remove(this.player.mesh);
//     }

//         switch (type) {
//             case "WALKER":
//                 this.player = new Walker(this.camera, this.scene, this.world);
//                 break;
//             case "WHEEL":
//                 this.player = new Wheel(this.camera, this.scene, this.world);
//                 break;
//             case "BALL":
//                 this.player = new Ball(this.camera, this.scene, this.world);
//                 break;
//             case "SNOWBOARD":
//                 this.player = new SnowBoard(this.camera, this.scene, this.world);
//                 break;
//             case "JETPLANE":
//                 this.player = new Plane(this.camera, this.scene, this.world);
//                 this.player.setPlaneAttributes(25, 0.2, 11500, 1.0, 0.05, 200);
//                 break;
//             case "DELTAPLANE":
//                 this.player = new Plane(this.camera, this.scene, this.world);
//                 this.player.setPlaneAttributes(15, 0.1, 120, 1.0, 0.05, 15);
//                 break;
//             default:
//                 this.player = new Walker(this.camera, this.scene, this.world);
//                 break;
//         }

//         // restore position
//         this.player.position.copy(position);

//         // manage HUD
//         oldHud?.deactivate();
//         if (this.player instanceof Plane) {
//             this.player.hud.activate();
//         }
//     }

//     updateTracksColor() {
//         this.player.footprints?.updateMaterialColor(this.world.getMaterialColor());
//     }

//     update(delta, controls) {
//         this.player.update(delta, controls);
//     }
// }
        // if (controls.interact && performance.now() - this.lastInteractTime > interactInterval) {
        //     if (this.current instanceof Walker) {
        //         const { minDistance, closestVehicule } = this.closestVehicule(this.camera.position);
        //         console.log("distance = ", minDistance);
        //         if (minDistance <= distToMount)
        //             this.getOnVehicule(closestVehicule);
        //     }
        //     else {
        //         this.getOffVehicule(this.current);
        //     }

        //     this.lastInteractTime = performance.now();
        //     controls.interact = false;
        // }

import { ChunkManager } from "./ChunkManager.js";
import { Rubber } from "./Rubber.js";
import { Walker } from "./Walker.js";
import { Wheel } from "./AVehicule.js";
import { SnowBoard } from "./AVehicule.js";
import { Ball } from "./AVehicule.js";
import { Plane } from "./AVehicule.js";

const distToMount = 4;
const interactInterval = 1000; //ms

export class Player {
    constructor(camera, scene, world) {
        this.camera = camera;
        this.scene = scene;

        this.walker = new Walker(this.camera, scene, world);
        this.vehicules = [
            new Wheel(this.camera, scene, world),
            new Ball(this.camera, scene, world),
            new SnowBoard(this.camera, scene, world),
            new Plane(this.camera, scene, world),
            new Plane(this.camera, scene, world),
        ];
        // Jet
        this.vehicules[3].setPlaneAttributes(25, 0.2, 11500, 1.0, 0.05, 200);
        // Deltaplane
        this.vehicules[4].setPlaneAttributes(15, 0.1, 120, 1.0, 0.05, 15);

        this.lastInteractTime = 0;

        // this.current = this.vehicules[3];
        // this.current.hud.activate();

        this.current = this.walker; // default mode
    }

    resetPosition() {
        this.current.position.set(0, 0, 0);
    }

    setVehiculeType(type) {
        switch (type) {
            case "WALKER": {
                this.current = this.walker;
                break;
            }
            case "WHEEL": {
                this.current = this.vehicules[0];
                break;
            }
            case "BALL": {
                this.current = this.vehicules[1];
                break;
            }
            case "SNOWBOARD": {
                this.current = this.vehicules[2];
                break;
            }
            case "JETPLANE": {
                this.current = this.vehicules[3];
                break;
            }
            case "DELTAPLANE": {
                this.current = this.vehicules[4];
                break;
            }
            default: {
                this.current = this.walker;
                break;
            }
        }
        this.vehicules[3].hud.deactivate();
        this.vehicules[4].hud.deactivate();
        if (this.current instanceof Plane)
            this.current.hud.activate();
    }

    updateTracksColor() {
        this.walker.footprints.updateMaterialColor(this.world.getMaterialColor());

        for (const vehicule of this.vehicules) {
            vehicule.decals?.updateMaterialColor(this.world.getMaterialColor());
        }
    }

    getOnVehicule(vehicule) {
        this.current = vehicule;
        if (this.current instanceof Plane)
            this.current.hud.activate();
    }

    getOffVehicule(vehicule) {
        if (this.current instanceof Plane)
            this.current.hud.deactivate();
        const pos = vehicule.getPosition();
        this.walker.setPosition(pos.x, pos.z, pos.y);
        this.current = this.walker;
    }

    getSpeed() {
        if (this.current instanceof Walker)
            return 0;
        return this.current.getSpeed();
    }

    closestVehicule(pos) {
        let minDistance = Infinity;
        let closestVehicule = null;

        for (const vehicule of this.vehicules) {
            const vPos = vehicule.getPosition();
            const distance = (pos.clone().sub(vPos)).length();

            if (distance < minDistance) {
                minDistance = distance;
                closestVehicule = vehicule;
            }
        }
        return { minDistance, closestVehicule };
    }

    update(delta, controls) {
        for (const vehicule of this.vehicules) {
            if (this.current != vehicule)
                vehicule.update(delta, null);
        }
        this.current.update(delta, controls);

        if (controls.interact && performance.now() - this.lastInteractTime > interactInterval) {
            if (this.current instanceof Walker) {
                const { minDistance, closestVehicule } = this.closestVehicule(this.camera.position);
                console.log("distance = ", minDistance);
                if (minDistance <= distToMount)
                    this.getOnVehicule(closestVehicule);
            }
            else {
                this.getOffVehicule(this.current);
            }

            this.lastInteractTime = performance.now();
            controls.interact = false;
        }
    }
}