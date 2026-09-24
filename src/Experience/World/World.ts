import * as THREE from "three";
import Experience from "../Experience";
import SeededRandom from "../Utils/SeededRandom";
import { gsap } from "gsap";

export default class World {
    experience: Experience;
    scene: THREE.Scene;
    projectGroup!: THREE.Group;
    randomGen: SeededRandom;

    // The exact variables used in the original source code
    private targetGroupQuaternion = new THREE.Quaternion();
    private _cameraWorldQuat = new THREE.Quaternion();
    private _groupWorldQuat = new THREE.Quaternion();
    private _groupInverseQuat = new THREE.Quaternion();

    private currentFocusIndex: number = 0;

    constructor() {
        this.experience = Experience.instance;
        this.scene = this.experience.scene;

        this.randomGen = new SeededRandom(98765);

        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        this.scene.add(ambientLight);

        this.setProjects();
        this.setTestListener();
    }

    setProjects() {
        this.projectGroup = new THREE.Group();
        this.scene.add(this.projectGroup);

        const minRadius = 6;
        const maxRadius = 8;

        const projectsData = new Array(28).fill({ name: "Project" });

        const meshMaterial = new THREE.MeshBasicMaterial({
            color: 0x4444ff,
            side: THREE.DoubleSide,
        });

        const totalProjects = projectsData.length;
        const goldenRatio = (1 + Math.sqrt(5)) / 2;

        projectsData.forEach((project, i) => {
            const y = 1 - (i / (totalProjects - 1)) * 2;
            const radiusAtY = Math.sqrt(1 - y * y);
            const theta = (Math.PI * 2 * i) / goldenRatio;

            const randomRadius = this.randomGen.range(minRadius, maxRadius);

            const x = Math.cos(theta) * radiusAtY;
            const z = Math.sin(theta) * radiusAtY;

            const geometry = new THREE.PlaneGeometry(1.5, 1);
            const mesh = new THREE.Mesh(geometry, meshMaterial);

            mesh.position.set(x, y, z).normalize().multiplyScalar(randomRadius);

            mesh.userData = {
                normalizedPosition: mesh.position.clone().normalize(),
                originalRadius: randomRadius,
            };

            this.projectGroup.add(mesh);
        });
    }

    setTestListener() {
        window.addEventListener("keydown", (event) => {
            if (event.key.toLowerCase() === "a") {
                this.currentFocusIndex =
                    (this.currentFocusIndex + 1) %
                    this.projectGroup.children.length;
                const nextMesh = this.projectGroup.children[
                    this.currentFocusIndex
                ] as THREE.Mesh;
                this.focusOnProject(nextMesh);
            }
        });
    }

    focusOnProject(mesh: THREE.Mesh) {
        // 1. Calculate the rotation needed to center the mesh
        const targetDirection = new THREE.Vector3(0, 0, 1);
        const childDirection = mesh.userData.normalizedPosition;

        // 2. Instead of GSAP, we just store this target quaternion.
        // The update() loop will handle the smooth animation organically.
        this.targetGroupQuaternion.setFromUnitVectors(
            childDirection,
            targetDirection,
        );
    }

    update() {
        if (this.projectGroup) {
            // 1. Smoothly rotate the entire group toward the target (0.09 speed mimics the source)
            this.projectGroup.quaternion.slerp(
                this.targetGroupQuaternion,
                0.09,
            );

            // 2. The exact billboarding math pulled from the original site
            this.experience.camera.instance.getWorldQuaternion(
                this._cameraWorldQuat,
            );
            this.projectGroup.getWorldQuaternion(this._groupWorldQuat);

            this._groupInverseQuat
                .copy(this._groupWorldQuat)
                .invert()
                .multiply(this._cameraWorldQuat);

            // 3. Apply it instantly to every plane
            this.projectGroup.children.forEach((child) => {
                child.quaternion.copy(this._groupInverseQuat);
            });
        }
    }
}
