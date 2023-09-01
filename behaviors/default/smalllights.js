// the following import statement is solely for the type checking and
// autocompletion features in IDE.  A Behavior cannot inherit from
// another behavior or a base class but can use the methods and
// properties of the card to which it is installed.
// The prototype classes ActorBehavior and PawnBehavior provide
// the features defined at the card object.

import {ActorBehavior, PawnBehavior} from "../PrototypeBehavior";

class LightPawn extends PawnBehavior {
    setup() {
        this.removeLights();
        this.lights = [];
        this.constructBackground(this.actor._cardData);
        this.constructDirectionalLights();
        this.listen("updateShape", "updateShape");
    }

    constructDirectionalLights() {
        let group = this.shape;

        let points = [
            {v: [1.8, 30, 14], s: false},
        ];
        points.forEach((pair) => {
            let v = pair.v
            let point = new Microverse.THREE.PointLight(0xffffff, 0.5);
            point.position.set(...v);
            if (pair.s) {
                point.castShadow = true;
            }
            this.lights.push(point);
            group.add(point);
        });

        let directional = new Microverse.THREE.DirectionalLight(0xffffff, 0.8);
        directional.position.set(2, 20, 30);
        // directional.castShadow = true;
        this.lights.push(directional);
        group.add(directional);
    }

    removeLights() {
        if (this.lights) {
            [...this.lights].forEach((light) => {
                light.dispose();
                this.shape.remove(light);
            });
        }
        delete this.lights;
    }

    teardown() {
        console.log("teardown lights");
        if(this.background)this.background.dispose();
        this.removeLights();
    }

    updateShape(options) {
        this.constructBackground(options);
    }

    constructBackground(options) {
        let assetManager = this.service("AssetManager").assetManager;
        let dataType = options.dataType;
        if (!options.dataLocation) {return;}
        return this.getBuffer(options.dataLocation).then((buffer) => {
            return assetManager.load(buffer, dataType, Microverse.THREE, options).then((texture) => {
                let TRM = this.service("ThreeRenderManager");
                let renderer = TRM.renderer;
                let scene = TRM.scene;
                let pmremGenerator = new Microverse.THREE.PMREMGenerator(renderer);
                pmremGenerator.compileEquirectangularShader();

                let exrCubeRenderTarget = pmremGenerator.fromEquirectangular(texture);
                let exrBackground = exrCubeRenderTarget.texture;

                let bg = scene.background;
                let e = scene.environment;
                scene.background = exrBackground;
                scene.environment = exrBackground;
                if(e !== bg) if(bg) bg.dispose();
                if(e) e.dispose();
                texture.dispose();
            });
        });
    }
}

export default {
    modules: [
        {
            name: "Light",
            pawnBehaviors: [LightPawn]
        }
    ]
}

/* globals Microverse */
