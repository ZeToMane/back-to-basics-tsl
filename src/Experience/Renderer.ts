import * as THREE from "three/webgpu";
import Experience from "./Experience";

export default class Renderer {
    experience: Experience;
    canvas: HTMLCanvasElement;
    sizes: Experience["sizes"];
    scene: THREE.Scene;
    camera: Experience["camera"];
    instance!: THREE.WebGPURenderer;

    constructor() {
        this.experience = Experience.instance;
        this.canvas = this.experience.canvas;
        this.sizes = this.experience.sizes;
        this.scene = this.experience.scene;
        this.camera = this.experience.camera;

        this.setInstance();
    }

    setInstance() {
        this.instance = new THREE.WebGPURenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true,
        });
        this.instance.setClearColor("#000000", 0);
        this.instance.setSize(this.sizes.width, this.sizes.height);
        this.instance.setPixelRatio(this.sizes.pixelRatio);
    }

    resize() {
        this.instance.setSize(this.sizes.width, this.sizes.height);
        this.instance.setPixelRatio(this.sizes.pixelRatio);
    }

    async update() {
        await this.instance.renderAsync(this.scene, this.camera.instance);
    }
}
