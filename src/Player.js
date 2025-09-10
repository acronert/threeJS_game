import { ChunkManager } from "./ChunkManager.js";
import { Rubber } from "./Rubber.js";
import { Walker } from "./Walker.js";

const distToMount = 4;
const interactInterval = 1000; //ms

export class Player {
    constructor(camera, scene, ChunkManager) {
        this.camera = camera;
        this.scene = scene;

        this.walker = new Walker(this.camera, scene, ChunkManager);
        this.rubber = new Rubber(this.camera);

        this.rubberMesh = this.rubber.getRubberMesh()
        this.scene.add(this.rubberMesh);

        this.lastInteractTime = 0;

        this.current = this.walker; // default mode
    }

    getOnRubber() {
        console.log("getOnRubber");
        this.camera.position.x = 0;
        this.camera.position.y = 0;
        this.camera.position.z = 0;
        this.camera.rotation.x = 0;
        this.camera.rotation.y = 0;
        this.camera.rotation.z = 0;
        this.current = this.rubber;
    }

    getOffRubber() {
        console.log("getOffRubber");
        this.walker.setPosition(this.camera.x - 0.5, 0, this.camera.z - 0.5);
        this.camera.position.x = 0;
        this.camera.position.y = 0;
        this.camera.position.z = 0;
        this.camera.rotation.x = 0;
        this.camera.rotation.y = 0;
        this.camera.rotation.z = 0;
        this.current = this.walker;
    }

    distanceToRubber() {
        return Math.sqrt((this.camera.position.x - this.rubberMesh.position.x)**2
                        + (this.camera.position.z - this.rubberMesh.position.z)**2);
    }


    update(delta, controls) {
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