// the following import statement is solely for the type checking and
// autocompletion features in IDE.  A Behavior cannot inherit from
// another behavior or a base class but can use the methods and
// properties of the card to which it is installed.
// The prototype classes ActorBehavior and PawnBehavior provide
// the features defined at the card object.

import {ActorBehavior, PawnBehavior} from "../PrototypeBehavior";

class GarageActor extends ActorBehavior {
    setup() {
        this.points = [
            {
                pointA:  [7.799494248347024, -0.3110201562611392, 10.508325734249267],
                pointB: [7.799494248347024, -0.3110201562611392 + 4.5, 10.508325734249267]
            }, {
                pointA: [16.016934687664644, -1.7187205841929383, -40.90],
                pointB: [16.016934687664644, -1.7187205841929383 + 4.5, -40.90]
            }, {
                pointA: [32.58497101769043, -1.7187205841929383, -22.2463885085511],
                pointB: [32.58497101769043, -1.7187205841929383 + 4.5, -22.2463885085511],
            }
        ];

        let index = this._cardData.garageIndex || 0;
        this.pointA = this.points[index].pointA;
        this.pointB = this.points[index].pointB;

        this.subscribe(this.id, "updatePositionBy", "updatePositionBy");

        if (this._cardData.ratio === undefined) this._cardData.ratio = 0;
        if (this.nextDirection === undefined) this.nextDirection = "up";
        if (this.moving === undefined) this.moving = false;

        this.updatePositionBy(0);
        this.addEventListener("pointerDown", "trigger");
        this.addEventListener("pointerDoubleDown", "nop");
    }

    trigger() {
        if (this.moving) {
            this.moving = false;
            this.nextDirection = this.nextDirection === "up" ? "down" : "up";
            return;
        }
        this.moving = true;
        if (this.nextDirection === "up") {
            this.up();
        } else {
            this.down();
        }
    }

    up() {
        this.updatePositionBy(0.03125);
        if (this.moving) {
            this.future(50).up();
        }
    }

    down() {
        this.updatePositionBy(-0.03125);
        if (this.moving) {
            this.future(50).down();
        }
    }

    updatePositionBy(ratio) {
        this._cardData.ratio += ratio;
        this._cardData.ratio = Math.min(1, Math.max(0, this._cardData.ratio));
        if (this._cardData.ratio >= 0.75) {
            this._cardData.ratio = 0.75;
            this.moving = false;
            this.nextDirection = "down";
        } else if (this._cardData.ratio <= 0) {
            this._cardData.ratio = 0;
            this.moving = false;
            this.nextDirection = "up";
        }
        this.set({translation: Microverse.v3_lerp(this.pointA, this.pointB, this._cardData.ratio)});
        this.say("updateDisplay");
    }
}

class GaragePawn extends PawnBehavior {
    setup() {
        this.listen("updateDisplay", "updateDisplay");
    }

    initializeClipping() {
        if (this.initialized) {return;}

        this.obj = this.shape.children[0];

        let THREE = Microverse.THREE;
        this.clippingPlanes = [
            new THREE.Plane(new THREE.Vector3(0, 1, 0),  0),
            new THREE.Plane(new THREE.Vector3(0, -1, 0), 0),
            new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0),
            new THREE.Plane(new THREE.Vector3(1, 0, 0), 0)
        ];
        this.initialized = !!this.obj;
    }

    updateDisplay() {
        this.initializeClipping();

        let w = 7.0;
        let h = 4.5;

        let left = w / 2;
        let right = w / 2;
        let bottom = h * (1 - this.actor._cardData.ratio) - 0.5;
        let top = h;
        let planes = this.computeClippingPlanes([top, bottom, right, left]);

        if (!this.obj) {return;}
        this.obj.traverse((n) => {
            if (n.material) {
                n.material.clippingPlanes = planes;
            }
        });
    }

    updatePosition() {
        this.initializeClipping();
        this.publish(this.actor.id, "updatePositionBy", 0.03125);
    }

    computeClippingPlanes(ary) {
        //let [top, bottom, right, left] = ary; this is the order
        let planes = [];
        if (Number.isNaN(this.shape.matrixWorld.elements[0])) return [];
        for (let i = 0; i < 4; i++) {
            planes[i] = new Microverse.THREE.Plane();
            planes[i].copy(this.clippingPlanes[i]);
            planes[i].constant = ary[i];
            planes[i].applyMatrix4(this.shape.matrixWorld);
        }
        return planes;
    }
}

export default {
    modules: [
        {
            name: "Garage",
            actorBehaviors: [GarageActor],
            pawnBehaviors: [GaragePawn]
        },
    ]
}

/* globals Microverse */
