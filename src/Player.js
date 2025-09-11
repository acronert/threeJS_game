import { ChunkManager } from "./ChunkManager.js";
import { Rubber } from "./Rubber.js";
import { Walker } from "./Walker.js";

const distToMount = 4;
const interactInterval = 1000; //ms

export class Player {
    constructor(camera, scene, chunkManager) {
        this.camera = camera;
        this.scene = scene;

        this.walker = new Walker(this.camera, scene, chunkManager);
        this.rubber = new Rubber(this.camera, scene, chunkManager, 3, 0);

        this.rubberMesh = this.rubber.getRubberMesh()
        this.scene.add(this.rubberMesh);

        this.lastInteractTime = 0;

        this.current = this.walker; // default mode
    }

    getOnRubber() {
        console.log("getOnRubber");
        this.current = this.rubber;
    }

    getOffRubber() {
        console.log("getOffRubber");
        const pos = this.rubber.getPosition();
        this.walker.setPosition(pos.x, pos.z, 0);
        this.current = this.walker;
    }

    distanceToRubber() {
        return Math.sqrt((this.camera.position.x - this.rubberMesh.position.x)**2
                        + (this.camera.position.z - this.rubberMesh.position.z)**2);
    }


    update(delta, controls) {
        if (this.current instanceof Rubber == false) {
            this.rubber.update(delta, null);
        }
        this.current.update(delta, controls);

        if (controls.interact && performance.now() - this.lastInteractTime > interactInterval) {
            console.log("interact, dist:", this.distanceToRubber());
            if (this.current instanceof Walker && this.distanceToRubber() <= distToMount)
                this.getOnRubber();
            else if (this.current instanceof Rubber)
                this.getOffRubber();

            this.lastInteractTime = performance.now();
            controls.interact = false;
        }
    }
}