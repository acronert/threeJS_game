import { FrontSide } from "three";

export class HUD {
    constructor(plane) {
        this.plane = plane;

        // create HUD canvas
        this.hudCanvas = document.createElement("canvas");
        this.hudCanvas.style.position = "absolute";
        this.hctx = this.hudCanvas.getContext("2d");
        this.hudCanvas.style.pointerEvents = "none";

        // create decoration canvas
        this.decoCanvas = document.createElement("canvas");
        this.decoCanvas.style.position = "absolute";
        this.dctx = this.decoCanvas.getContext("2d");
        this.decoCanvas.style.pointerEvents = "none";
        
        // create pitch ladder canvas
        this.ladderCanvas = document.createElement("canvas");
        this.ladderCanvas.style.position = "absolute";
        // document.body.appendChild(this.ladderCanvas);
        this.lctx = this.ladderCanvas.getContext("2d");
        this.ladderCanvas.style.pointerEvents = "none";

        window.addEventListener("resize", () => this.resize());

        this.resize();
    }

    resize() {
        if (this.activated == false)
            return;
        this.size = Math.min(window.innerHeight, window.innerWidth);

        this.lineWidth = this.size / 300;

        // Recalculate HUD canvas
        this.hudCanvas.width = this.size;
        this.hudCanvas.height = this.size;
        this.hudCanvas.style.top = `${Math.floor((window.innerHeight - this.size) / 2)}px`;
        this.hudCanvas.style.left = `${Math.floor((window.innerWidth - this.size) / 2)}px`;

        // Recalculate deco canvas
        this.decoCanvas.width = this.size;
        this.decoCanvas.height = this.size;
        this.decoCanvas.style.top = `${Math.floor((window.innerHeight - this.size) / 2)}px`;
        this.decoCanvas.style.left = `${Math.floor((window.innerWidth - this.size) / 2)}px`;

        // Recalculate ladder canvas
        this.ladderCanvas.width = this.size;
        this.ladderCanvas.height = this.size * 9;
        this.ladderCanvas.style.top = `${Math.floor((window.innerHeight - this.ladderCanvas.height) / 2)}px`;
        this.ladderCanvas.style.left = `${Math.floor((window.innerWidth - this.size) / 2)}px`;


        // Recalculate layouts
        this.altim = {
            width: this.size * 0.10,
            height: this.size * 0.65,
            x: this.size * 0.90,
            y: this.size * 0.1,
        };
        this.altim.fontSize = this.altim.width / 4;

        this.speedo = {
            width: this.size * 0.10,
            height: this.size * 0.65,
            x: this.size * 0.0,
            y: this.size * 0.1,
        };
        this.speedo.fontSize = this.speedo.width / 4;

        this.speedInfo = {
            width: this.size * 0.10,
            height: this.size * 0.10,
            x: this.size * 0.0,
            y: this.size * 0.82,
        };
        this.speedInfo.fontSize = this.size / 35;

        this.thrust = {
            width: this.size * 0.10,
            height: this.size * 0.10,
            x: this.size * 0.90,
            y: this.size * 0.82,
        };
        this.thrust.fontSize = this.size / 35;

        this.pitchLadder = {
            width: this.size * 0.78,
            height: this.size * 0.78,
            x: this.size * 0.11,
            y: this.size * 0.10,
        };

        this.compas = {
            width: this.size * 0.30,
            height: this.size * 0.20,
            x: this.size * 0.35,
            y: this.size * 0.80,
        };
        this.compas.fontSize = this.size / 40;

        this.createDecoCanvas();
        this.createLadderCanvas();
    }

    createLadderCanvas() {
        this.lctx.clearRect(0, 0, this.ladderCanvas.width, this.ladderCanvas.height);

        const tickSpacing = this.ladderCanvas.height / 36; // pixels between minor ticks
        const unitsPerTick = 5;

        const xCenter = this.ladderCanvas.width / 2;
        const yCenter = this.ladderCanvas.height / 2;

        const lineHook = this.size * 0.01;
        const lineWidth = this.size * 0.5;
        const lineGap = this.size * 0.2;
        const valueOffset = lineWidth / 2 + this.size * 0.01;
        const fontSize = this.size / 50;
        // dash line
        const dash = this.size * 0.02;
        const gap = this.size * 0.005;

        this.lctx.strokeStyle = "rgba(0, 255, 0, 0.7)";
        this.lctx.lineWidth = this.lineWidth;
        this.lctx.fillStyle = "rgba(0, 255, 0, 0.7)";
        this.lctx.font = `${fontSize}px 'Courier New', monospace`;

        this.lctx.beginPath();

        // draw the lines
        for (let i = -18; i <= 18; i++) {
            let hook = lineHook;
            if (i > 0) {
                this.lctx.setLineDash([]);
                this.lctx.textBaseline = "top"
            } else if (i < 0) {
                hook = -hook;
                this.lctx.setLineDash([dash, gap]);
                this.lctx.textBaseline = "bottom"
            }
            else {
                hook = 0;
                this.lctx.setLineDash([]);
                this.lctx.textBaseline = "middle";
            }
            this.lctx.beginPath();

            this.lctx.moveTo(xCenter - lineWidth / 2, yCenter - i * tickSpacing + hook);
            this.lctx.lineTo(xCenter - lineWidth / 2, yCenter - i * tickSpacing);
            this.lctx.lineTo(xCenter - lineGap / 2, yCenter - i * tickSpacing);
            this.lctx.moveTo(xCenter + lineGap / 2, yCenter - i * tickSpacing);
            this.lctx.lineTo(xCenter + lineWidth / 2, yCenter - i * tickSpacing);
            this.lctx.lineTo(xCenter + lineWidth / 2, yCenter - i * tickSpacing + hook);

            this.lctx.stroke();

            // text
            const textValue = (i * unitsPerTick).toString();
            this.lctx.textAlign = "right";
            this.lctx.fillText(textValue, xCenter - valueOffset, yCenter - i * tickSpacing);
            this.lctx.textAlign = "left";
            this.lctx.fillText(textValue, xCenter + valueOffset, yCenter - i * tickSpacing);
        }
    }

    createDecoCanvas() {
        // Clear canvas
        this.dctx.clearRect(0, 0, this.decoCanvas.width, this.decoCanvas.height);

        this.dctx.strokeStyle = "rgba(0, 255, 0, 0.7)";
        this.dctx.lineWidth = this.lineWidth;
        this.dctx.fillStyle = "rgba(0, 255, 0, 0.7)";

        // Center target
        {
            this.dctx.beginPath();
            this.dctx.moveTo(this.size * 0.42, this.size * 0.50);
            this.dctx.lineTo(this.size * 0.48, this.size * 0.50);
            this.dctx.lineTo(this.size * 0.49, this.size * 0.51);
            this.dctx.lineTo(this.size * 0.50, this.size * 0.50);
            this.dctx.lineTo(this.size * 0.51, this.size * 0.51);
            this.dctx.lineTo(this.size * 0.52, this.size * 0.50);
            this.dctx.lineTo(this.size * 0.58, this.size * 0.50);
            this.dctx.stroke();

        }
        // Speedometer (left side)
        {
            const { width, height, x, y, fontSize } = this.speedo;
            // Contour
            this.dctx.beginPath();
            this.dctx.moveTo(x, y);
            this.dctx.lineTo(x + width, y);
            this.dctx.lineTo(x + width, y + height);
            this.dctx.lineTo(x, y + height);
            this.dctx.stroke();
            // Arrow
            this.dctx.beginPath();
            this.dctx.moveTo(width + this.lineWidth / 2 + x + this.size * 0.01, this.size * 0.49);
            this.dctx.lineTo(width + this.lineWidth / 2 + x, this.size * 0.50);
            this.dctx.lineTo(width + this.lineWidth / 2 + x + this.size * 0.01, this.size * 0.51);
            this.dctx.stroke();
        }
        // Altimeter (right side)
        {
            const { width, height, x, y, fontSize } = this.altim;
            // Contour
            this.dctx.beginPath();
            this.dctx.moveTo(x + width, y);
            this.dctx.lineTo(x, y);
            this.dctx.lineTo(x, y + height);
            this.dctx.lineTo(x + width, y + height);
            this.dctx.stroke();
            // Arrow
            this.dctx.beginPath();
            this.dctx.moveTo(-this.lineWidth / 2 + x - this.size * 0.01, this.size * 0.49);
            this.dctx.lineTo(-this.lineWidth / 2 + x, this.size * 0.50);
            this.dctx.lineTo(-this.lineWidth / 2 + x - this.size * 0.01, this.size * 0.51);
            this.dctx.stroke();
        }
        // Compas
        {
            const { width, height, x, y, fontSize } = this.compas;
            // Arrow
            this.dctx.beginPath();
            this.dctx.moveTo(this.size * 0.49, y - this.size * 0.01);
            this.dctx.lineTo(this.size * 0.50, y);
            this.dctx.lineTo(this.size * 0.51, y - this.size * 0.01);
            this.dctx.stroke();
            // cross
            this.dctx.beginPath();
            this.dctx.moveTo(x + width / 2, y + width / 2 - width * 0.34 * 0.85);
            this.dctx.lineTo(x + width / 2, y + width / 2 + width * 0.34 * 0.85);
            this.dctx.moveTo(x + width / 2 - width * 0.34 * 0.85, y + width / 2);
            this.dctx.lineTo(x + width / 2 + width * 0.34 * 0.85, y + width / 2);
            this.dctx.stroke();

        }
    }

    updateAltimeter(altitude) {
        const { width, height, x, y, fontSize } = this.altim;
        const tickSpacing = this.size / 15; // pixels between minor ticks
        const unitsPerTick = 50; // altitude units per tick
        const unitPerLabel = 100;

        // Ruler
        this.hctx.strokeStyle = "rgba(0, 255, 0, 0.7)";
        this.hctx.lineWidth = this.lineWidth;
        this.hctx.fillStyle = "rgba(0, 255, 0, 0.7)";
        this.hctx.font = `${fontSize}px 'Courier New', monospace`;
        this.hctx.textAlign = "left";
        this.hctx.textBaseline = "middle";

        const offset = (altitude % unitsPerTick) / unitsPerTick * tickSpacing;
        for (let i = -10; i <= 10; i++) {
            const tickY = y + height / 2 + (i * tickSpacing) + offset;
            const tickValue = Math.floor(altitude / unitsPerTick) * unitsPerTick - i * unitsPerTick;
            // Skip drawing outside window
            if (tickY < y + (fontSize / 2) || tickY > y + height - (fontSize / 2)) continue;
            // Tick line
            this.hctx.beginPath();
            this.hctx.moveTo(this.lineWidth / 2 + x, tickY);
            this.hctx.lineTo(this.lineWidth / 2 + x + width / 6, tickY);
            this.hctx.stroke();
            // Label
            if (tickValue % unitPerLabel === 0)
                this.hctx.fillText(tickValue.toString(), x + fontSize, tickY);
        }
    }

    updateSpeedometer(speed) {
        const { width, height, x, y, fontSize } = this.speedo;
        const tickSpacing = this.size / 15; // pixels between minor ticks
        const unitsPerTick = 10; // altitude units per tick
        const unitPerLabel = 20;

        // Ruler
        this.hctx.strokeStyle = "rgba(0, 255, 0, 0.7)";
        this.hctx.lineWidth = this.lineWidth;
        this.hctx.fillStyle = "rgba(0, 255, 0, 0.7)";
        this.hctx.font = `${fontSize}px 'Courier New', monospace`;
        this.hctx.textAlign = "right";
        this.hctx.textBaseline = "middle";

        const offset = (speed % unitsPerTick) / unitsPerTick * tickSpacing;
        for (let i = -10; i <= 10; i++) {
            const tickY = y + height / 2 + (i * tickSpacing) + offset;
            const tickValue = Math.floor(speed / unitsPerTick) * unitsPerTick - i * unitsPerTick;
            // Skip drawing outside window
            if (tickY < y + (fontSize / 2) || tickY > y + height - (fontSize / 2)) continue;
            // Tick line
            this.hctx.beginPath();
            this.hctx.moveTo(-this.lineWidth / 2 + x + width, tickY);
            this.hctx.lineTo(-this.lineWidth / 2 + x + 5 * width / 6, tickY);
            this.hctx.stroke();
            // Label
            if (tickValue % unitPerLabel === 0)
                this.hctx.fillText(tickValue.toString(), x + width - fontSize, tickY);
        }
    }

    getYawValue(angle) {
        switch (angle) {
            case (0): ;
            case (360): return "N";
            case (270): return "W";
            case (180): return "S";
            case (90): return "E";
            default: return Math.floor(angle / 10).toString();
        }
    }

    // yaw in degrees 0->360
    updateCompas(yawRad) {
        const { width, height, x, y, fontSize } = this.compas;

        this.hctx.strokeStyle = "rgba(0, 255, 0, 0.7)";
        this.hctx.lineWidth = this.lineWidth;
        this.hctx.fillStyle = "rgba(0, 255, 0, 0.7)";
        this.hctx.font = `${fontSize}px 'Courier New', monospace`;
        this.hctx.textAlign = "center";
        this.hctx.textBaseline = "middle";

        const xCenter = x + width / 2;
        const yCenter = y + width / 2;
        const outerRadius = width * 0.5;
        const innerRadius = width * 0.4;
        const labelRadius = width * 0.34;
        const unitsPerTick = 10;            // degrees per tick
        const unitPerLabel = 30;

        yawRad = (yawRad + 2 * Math.PI); // don't ask
        const yawDeg = yawRad * 180 / Math.PI;

        const offset = (yawDeg % unitsPerTick) + 85;
        for (let i = -12; i <= 12; i++) {
            const tickDeg = i * unitsPerTick + offset;
            const tickRad = tickDeg * Math.PI / 180;

            const cos = Math.cos(tickRad);
            const sin = Math.sin(tickRad);

            // Tick line
            this.hctx.beginPath();
            this.hctx.moveTo(xCenter - cos * innerRadius, yCenter - sin * innerRadius);
            this.hctx.lineTo(xCenter - cos * outerRadius, yCenter - sin * outerRadius);
            this.hctx.stroke();

            // let labelDeg = Math.round((tickDeg - offset + 360) % 360);
            let tickValue = Math.floor(yawDeg / unitsPerTick) * unitsPerTick - i * unitsPerTick;
            tickValue = 360 - (tickValue % 360); // because why not ?
            // Label
            if (tickValue % unitPerLabel == 0) {
                this.hctx.fillText(this.getYawValue(tickValue), xCenter - cos * labelRadius, yCenter - sin * labelRadius);
            }
        }

    }

    updateThrust(thrustLevel) {
        const { width, height, x, y, fontSize } = this.thrust;

        this.hctx.font = `${fontSize}px 'Courier New', monospace`;
        this.hctx.textAlign = "right";
        this.hctx.textBaseline = "top";

        // ThrustLevel
        this.hctx.fillText("THRUST", x + width, y);
        this.hctx.fillText(Math.round(thrustLevel * 100) + "%", x + width, y + height / 3);
    }

    updateSpeedInfo(speed) {
        const { width, height, x, y, fontSize } = this.speedInfo;

        this.hctx.font = `${fontSize}px 'Courier New', monospace`;
        this.hctx.textAlign = "left";
        this.hctx.textBaseline = "top";

        // Mach
        const soundSpeed = 1235.6; // km/h at 20 celsius
        const mach = speed / soundSpeed;
        this.hctx.fillText("M " + mach.toFixed(2), x, y);
    }

    updateRoll(pitch, roll) {
        const { width, height, x, y } = this.pitchLadder;

        this.hctx.save();
        // Restrict drawing to pitchLadder zone
        this.hctx.beginPath();
        this.hctx.rect(x, y, width, height);
        this.hctx.clip();

        this.hctx.translate(this.size / 2, this.size / 2);
        this.hctx.rotate(-roll);

        // Compute the part of the ladder we want to show (slice based on pitch)
        const srcHeight = this.size;
        const srcX = 0;
        const srcY = Math.floor(this.ladderCanvas.height / 2
            + pitch * this.ladderCanvas.height / Math.PI
            - srcHeight / 2);
        const srcW = this.ladderCanvas.width;
        const srcH = srcHeight;

        // Draw ladder slice centered at origin
        this.hctx.drawImage(
            this.ladderCanvas,
            srcX, srcY, srcW, srcH,   // source rectangle from ladderCanvas
            -this.size / 2, -this.size / 2,  // destination top-left (centered at origin)
            this.size, this.size             // destination size
        );

        this.hctx.restore();
    }

    deactivate() {
        this.activated = false;
        this.hctx.clearRect(0, 0, this.size, this.size);
        this.dctx.clearRect(0, 0, this.size, this.size);
        this.lctx.clearRect(0, 0, this.size, this.size * 9);
    }

    activate() {
        this.activated = true;
        this.createDecoCanvas();
        this.createLadderCanvas();

        document.body.appendChild(this.decoCanvas);
        document.body.appendChild(this.hudCanvas);

    }

    update() {
        this.hctx.clearRect(0, 0, this.size, this.size);

        const speed = this.plane.getSpeed() * 3.6;
        this.updateSpeedometer(speed);
        this.updateSpeedInfo(speed);
        const thrustLevel = this.plane.getThrustLevel();
        this.updateThrust(thrustLevel);
        this.updateAltimeter(this.plane.getAltitude());
        const euler = this.plane.getEuler();
        this.updateCompas(euler.y);
        this.updateRoll(euler.x, euler.z);

        this.hctx.save();

        // this.updateStall();
    }
}