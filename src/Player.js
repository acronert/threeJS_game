import { Rubber } from "./Rubber.js";
import { Walker } from "./Walker.js";

export class Player {
    constructor(camera) {
        this.camera = camera;

        this.walker = new Walker(this.camera);
        this.rubber = new Rubber(this.camera);
        this.current = this.walker; // default mode
    }

    getOnRubber() {

    }

    getOffRubber() {

    }

    update(delta, controls) {
        this.current.update(delta, controls);
    }
}