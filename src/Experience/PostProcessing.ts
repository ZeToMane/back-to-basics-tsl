import * as THREE from "three/webgpu";
import {
    pass,
    uv,
    vec2,
    vec3,
    vec4,
    max,
    mix,
    color,
    smoothstep,
    float,
} from "three/tsl";
import { bloom } from "three/addons/tsl/display/BloomNode.js";
import Experience from "./Experience";
import { dither } from "./Utils/DitherNode";
//import type { DitherParams } from "./Utils/DitherNode";

export default class PostProcessing {
    experience: Experience;
    renderer: THREE.WebGPURenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    instance: THREE.PostProcessing;

    constructor() {
        this.experience = Experience.instance;
        this.renderer = this.experience.renderer.instance;
        this.scene = this.experience.scene;
        this.camera = this.experience.camera.instance;

        this.instance = new THREE.PostProcessing(this.renderer);

        this.setPasses();
    }

    setPasses() {
        const scenePass = pass(this.scene, this.camera);

        scenePass.setResolutionScale(0.05);

        const sceneColor = scenePass.getTextureNode();

        sceneColor.value.magFilter = THREE.NearestFilter;
        sceneColor.value.minFilter = THREE.NearestFilter;

        const shiftAmount = 0.003;

        const r = scenePass
            .getTextureNode()
            .sample(uv().add(vec2(shiftAmount, 0.0))).r;
        const g = sceneColor.g;
        const b = scenePass
            .getTextureNode()
            .sample(uv().sub(vec2(shiftAmount, 0.0))).b;

        const rgbShifted = vec3(r, g, b);

        const bloomEffect = bloom(sceneColor, 2.8, 0.2, 0.1);

        const combinedEffect = rgbShifted.add(bloomEffect);

        const mask = max(
            combinedEffect.r,
            max(combinedEffect.g, combinedEffect.b),
        ).clamp(0.0, 1.0);

        const dist = uv().sub(0.5).length();
        const vignette = smoothstep(0.0, 0.75, dist);
        const backgroundBrightness = float(1.0).sub(vignette.mul(0.5));
        const whiteBackground = vec3(backgroundBrightness);

        const finalColor = mix(whiteBackground, combinedEffect, mask);

        const ditheredColor = dither({
            colorNode: finalColor,
            dotSize: 6.0,
        });

        this.instance.outputNode = vec4(ditheredColor, 1.0);
    }

    update() {
        this.instance.renderAsync();
    }
}
