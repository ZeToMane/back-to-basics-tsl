import * as THREE from "three/webgpu";
import Sizes from "./Utils/Sizes";
import Time from "./Utils/Time";
import Camera from "./Camera";
import Renderer from "./Renderer";
import World from "./World/World";
import PostProcessing from "./PostProcessing";
import Resources from "./Utils/Resources";
import sources from "./sources";

import SoundManager, { type SoundManifest } from "./Utils/soundManager";

export default class Experience {
    static instance: Experience;

    canvas!: HTMLCanvasElement;
    sizes!: Sizes;
    time!: Time;
    scene!: THREE.Scene;
    resources!: Resources;
    camera!: Camera;
    renderer!: Renderer;
    world!: World;
    postProcessing!: PostProcessing;
    soundManager!: SoundManager;

    constructor(canvas: HTMLCanvasElement) {
        if (Experience.instance) return Experience.instance;
        Experience.instance = this;

        this.canvas = canvas;
        this.sizes = new Sizes();
        this.time = new Time();
        this.scene = new THREE.Scene();
        this.resources = new Resources(sources);

        this.camera = new Camera();
        this.renderer = new Renderer();
        this.world = new World();

        this.postProcessing = new PostProcessing();

        this.soundManager = new SoundManager();

        const manifest: SoundManifest = {
            music: {
                background: "/assets/sounds/background.wav", // path relative to your public/static folder
            },
            sfx: {}, // empty for now since you only want music
        };

        this.soundManager.preload(manifest);

        this.sizes.on("resize", () => this.resize());
        this.time.on("tick", () => this.update());
    }

    resize() {
        this.camera.resize();
        this.renderer.resize();
    }

    update() {
        //this.camera.update();
        this.world.update();
        //this.renderer.update();
        this.postProcessing.update();
    }
}
