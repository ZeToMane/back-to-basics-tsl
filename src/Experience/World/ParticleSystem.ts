import * as THREE from "three/webgpu";
import {
    vec3,
    vec4,
    Fn,
    instancedArray,
    instanceIndex,
    storage,
    uniform,
    color,
    uv,
    time,
    mx_noise_float,
    sin,
    cos,
    smoothstep,
    deltaTime,
    If,
    hash,
    step,
} from "three/tsl";
import Experience from "../Experience";
import { simplexNoise4D } from "../Utils/Noise";

export default class ParticleSystem {
    experience: Experience;
    scene: THREE.Scene;
    renderer: THREE.WebGPURenderer;
    count: number;
    updateCompute: any;
    mesh!: THREE.Sprite;

    mousePos = new THREE.Vector3(999, 999, 999);
    uMouseSpeed = uniform(0.0);

    constructor(geometry: THREE.BufferGeometry) {
        this.experience = Experience.instance;
        this.scene = this.experience.scene;
        this.renderer = this.experience.renderer.instance;

        this.count = geometry.attributes.position.count;

        this.setSystem(geometry);
    }

    setSystem(geometry: THREE.BufferGeometry) {
        const basePositions = storage(
            geometry.attributes.position as THREE.BufferAttribute,
            "vec3",
            this.count,
        );

        const positions = instancedArray(this.count, "vec3");
        const lives = instancedArray(this.count, "float");

        const size = uniform(0.008);
        const uMousePos = uniform(this.mousePos);
        const baseColor = uniform(color("#1466ff"));

        const initCompute = Fn(() => {
            positions
                .element(instanceIndex)
                .assign(basePositions.element(instanceIndex));

            lives.element(instanceIndex).assign(hash(instanceIndex).negate());
        })().compute(this.count);

        this.renderer.computeAsync(initCompute);

        this.updateCompute = Fn(() => {
            const position = positions.element(instanceIndex);
            const basePosition = basePositions.element(instanceIndex);
            const life = lives.element(instanceIndex);

            const dt = deltaTime.min(0.2);
            life.addAssign(dt.mul(0.2)); //0.5

            const rotAngle = time.mul(0.5);
            const c = cos(rotAngle);
            const s = sin(rotAngle);

            const rotatedX = basePosition.x.mul(c).sub(basePosition.z.mul(s));
            const rotatedZ = basePosition.x.mul(s).add(basePosition.z.mul(c));

            const rotatedBase = vec3(rotatedX, basePosition.y, rotatedZ);

            If(life.greaterThanEqual(1.0), () => {
                position.assign(rotatedBase);
                life.assign(0.0);
            }).Else(() => {
                const t = time.mul(0.2);

                const pos = position.mul(3.0);

                const flowX = simplexNoise4D(vec4(pos.add(0.0), t)).sub(0.5);
                const flowY = simplexNoise4D(vec4(pos.add(1.0), t)).sub(0.5);
                const flowZ = simplexNoise4D(vec4(pos.add(2.0), t)).sub(0.5);

                const flowField = vec3(flowX, flowY, flowZ).normalize();

                const mouseDir = position.sub(uMousePos);
                const mouseDist = mouseDir.length();

                const repulseForce = smoothstep(0.1, 0.0, mouseDist).mul(
                    this.uMouseSpeed,
                );

                const repulsion = mouseDir
                    .normalize()
                    .mul(repulseForce)
                    .mul(0.05);

                const pullBack = rotatedBase.sub(position).mul(0.02);

                const flowSpeed = 0.15; // how fast the cycle repeats
                const flowSharpness = 4.0; // higher = spends more time near the low end, spikes are shorter/sharper

                const rawWave = sin(time.mul(flowSpeed)).mul(0.5).add(0.5); // 0..1
                const shapedWave = rawWave.pow(flowSharpness);

                const flowStrength = shapedWave
                    .mul(0.0099) // scale up to span (0.01 - 0.0001)
                    .add(0.0001); // floor at 0.0001

                position.addAssign(
                    flowField.mul(flowStrength).add(repulsion).add(pullBack),
                );
            });
        })().compute(this.count);

        const material = new THREE.SpriteNodeMaterial({
            transparent: true,
            depthWrite: false,
            blending: THREE.NormalBlending,
        });

        const lifeNode = lives.element(instanceIndex);
        material.positionNode = positions.element(instanceIndex);
        material.scaleNode = size
            .mul(step(0, lifeNode))
            .mul(lifeNode.oneMinus());
        material.colorNode = baseColor;

        this.mesh = new THREE.Sprite(material);
        this.mesh.count = this.count;
        this.mesh.frustumCulled = false;

        this.scene.add(this.mesh);
    }

    update() {
        if (this.updateCompute) {
            this.renderer.compute(this.updateCompute);
        }
    }
}
