import * as THREE from "three/webgpu";
import { time, sin, cos, vec3 } from "three/tsl";
import Experience from "../Experience";
import ParticleSystem from "./ParticleSystem";
import { MeshSurfaceSampler } from "three/addons/math/MeshSurfaceSampler.js";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";

export default class World {
    experience: Experience;
    scene: THREE.Scene;
    resources: Experience["resources"];
    cube!: THREE.Mesh;
    particleSystem!: ParticleSystem;

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2(-999, -999);
    plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    planeIntersect = new THREE.Vector3();
    previousIntersect = new THREE.Vector3();
    mouseSpeed = 0;

    constructor() {
        this.experience = Experience.instance;
        this.scene = this.experience.scene;
        this.resources = this.experience.resources;

        const ambientLight = new THREE.AmbientLight(0xffffff, 3);
        this.scene.add(ambientLight);

        this.resources.on("ready", () => {
            this.setModel();
            window.dispatchEvent(
                new CustomEvent("playMusic", {
                    detail: { name: "background" },
                }),
            );
        });

        window.addEventListener("mousemove", (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });
    }

    setModel() {
        const gltf = this.resources.items.sceneModel;
        const targetParticleCount = 1000;

        const geometries: THREE.BufferGeometry[] = [];

        gltf.scene.traverse((child: THREE.Object3D) => {
            if (child instanceof THREE.Mesh) {
                const clonedGeometry = child.geometry.clone();
                clonedGeometry.applyMatrix4(child.matrixWorld);
                geometries.push(clonedGeometry);
            }
        });

        if (geometries.length > 0) {
            const mergedGeometry =
                BufferGeometryUtils.mergeGeometries(geometries);

            const mergedMesh = new THREE.Mesh(mergedGeometry);

            const sampler = new MeshSurfaceSampler(mergedMesh).build();

            const positionArray = new Float32Array(targetParticleCount * 3);
            const tempPosition = new THREE.Vector3();

            for (let i = 0; i < targetParticleCount; i++) {
                sampler.sample(tempPosition);
                positionArray[i * 3 + 0] = tempPosition.x;
                positionArray[i * 3 + 1] = tempPosition.y;
                positionArray[i * 3 + 2] = tempPosition.z;
            }

            const sampledGeometry = new THREE.BufferGeometry();
            sampledGeometry.setAttribute(
                "position",
                new THREE.BufferAttribute(positionArray, 3),
            );

            // Scale the final point cloud up
            sampledGeometry.scale(5, 5, 5);

            this.particleSystem = new ParticleSystem(sampledGeometry);
        }
    }

    update() {
        if (this.cube) {
            this.cube.rotation.x += 0.01;
            this.cube.rotation.y += 0.015;
        }

        if (this.particleSystem) {
            this.raycaster.setFromCamera(
                this.mouse,
                this.experience.camera.instance,
            );

            this.raycaster.ray.intersectPlane(this.plane, this.planeIntersect);

            const dist = this.planeIntersect.distanceTo(this.previousIntersect);
            this.previousIntersect.copy(this.planeIntersect);

            const targetSpeed = Math.min(dist * 15.0, 1.0);

            this.mouseSpeed += (targetSpeed - this.mouseSpeed) * 0.01;

            this.particleSystem.mousePos.copy(this.planeIntersect);
            this.particleSystem.uMouseSpeed.value = this.mouseSpeed;

            this.particleSystem.update();
        }
    }
}
