import { ChunkManager } from "./ChunkManager.js";
import { Rubber } from "./Rubber.js";
import { Walker } from "./Walker.js";
import { Wheel } from "./AVehicule.js";
import { SnowBoard } from "./AVehicule.js";
import { Ball } from "./AVehicule.js";
import { Plane } from "./AVehicule.js";

const distToMount = 4;
const interactInterval = 1000; //ms

const speedometer = document.getElementById("speedometer");
const altimeter = document.getElementById("altimeter");
const thrustBar = document.getElementById("thrustBar");

export class Player {
    constructor(camera, scene, chunkManager) {
        this.camera = camera;
        this.scene = scene;

        this.walker = new Walker(this.camera, scene, chunkManager);
        this.vehicules = [
            new Wheel(this.camera, scene, chunkManager),
            new SnowBoard(this.camera, scene, chunkManager),
            new Ball(this.camera, scene, chunkManager),
            new Plane(this.camera, scene, chunkManager)
        ];

        this.lastInteractTime = 0;

        this.current = this.vehicules[3];
        this.current.hud.activate();

        // this.current = this.walker; // default mode
    }

    updateHUD() {
        if (this.current instanceof Walker)
            return;

        const speed = Math.floor(this.current.getSpeed() * 3.6); // m/s to km/h
        speedometer.textContent = speed + " km/h";
        
        if (this.current instanceof Plane) {
            const altitude = Math.floor(this.current.getAltitude());
            altimeter.textContent = altitude + " m";

            const percent = Math.floor(this.current.getThrustLevel() * 100);
            thrustBar.style.height = percent + "%";
        }
    }

    updateTracksColor(colorMap) {
        this.walker.footprints.updateMaterialColor(colorMap);

        for (const vehicule of this.vehicules) {
            vehicule.decals?.updateMaterialColor(colorMap);
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

        this.updateHUD();

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