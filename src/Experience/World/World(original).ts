import * as THREE from "three";
import Experience from "../Experience";
import SeededRandom from "../Utils/SeededRandom";
import { gsap } from "gsap";

export default class World {
    experience: Experience;
    scene: THREE.Scene;
    projectGroup!: THREE.Group;
    randomGen: SeededRandom;

    private worldPos = new THREE.Vector3();

    // Extracted so GSAP can access it
    private focusRadius: number = 20;

    private inverseRotation = new THREE.Quaternion();

    // For our 'A' key testing logic
    private currentFocusIndex: number = 0;

    constructor() {
        this.experience = Experience.instance;
        this.scene = this.experience.scene;

        this.randomGen = new SeededRandom(98765);

        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        this.scene.add(ambientLight);

        this.setProjects();

        // Start the test by focusing the very first mesh immediately
        this.focusOnProject(
            this.projectGroup.children[this.currentFocusIndex] as THREE.Mesh,
        );

        // Initialize the key listener
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
                // 1. Reset the currently focused mesh
                const currentMesh = this.projectGroup.children[
                    this.currentFocusIndex
                ] as THREE.Mesh;
                //this.resetProject(currentMesh);

                // 2. Increment the index (and wrap back to 0 if we hit the end of the array)
                this.currentFocusIndex =
                    (this.currentFocusIndex + 1) %
                    this.projectGroup.children.length;

                // 3. Focus the next mesh
                const nextMesh = this.projectGroup.children[
                    this.currentFocusIndex
                ] as THREE.Mesh;
                this.focusOnProject(nextMesh);
            }
        });
    }

    focusOnProject(mesh: THREE.Mesh) {
        // Rotate the parent group
        const targetDirection = new THREE.Vector3(0, 0, 1);
        const childDirection = mesh.userData.normalizedPosition;

        const targetQuaternion = new THREE.Quaternion();
        targetQuaternion.setFromUnitVectors(childDirection, targetDirection);

        gsap.to(this.projectGroup.quaternion, {
            x: targetQuaternion.x,
            y: targetQuaternion.y,
            z: targetQuaternion.z,
            w: targetQuaternion.w,
            duration: 1.2,
            ease: "power3.out",
        });

        /* // Move the child mesh forward
        const targetPosition = childDirection
            .clone()
            .multiplyScalar(this.focusRadius);

        gsap.to(mesh.position, {
            x: targetPosition.x,
            y: targetPosition.y,
            z: targetPosition.z,
            duration: 1.2,
            ease: "power3.out",
        }); */
    }

    /* resetProject(mesh: THREE.Mesh) {
        const originalPosition = mesh.userData.normalizedPosition
            .clone()
            .multiplyScalar(mesh.userData.originalRadius);

        gsap.to(mesh.position, {
            x: originalPosition.x,
            y: originalPosition.y,
            z: originalPosition.z,
            duration: 1.0,
            ease: "power3.inOut",
        });
    } */

    update() {
        if (this.projectGroup) {
            // 1. Get the exact opposite of the group's current rotation
            this.inverseRotation.copy(this.projectGroup.quaternion).invert();

            // 2. Apply that opposite rotation directly to every child
            this.projectGroup.children.forEach((child) => {
                child.quaternion.copy(this.inverseRotation);
            });
        }
    }
}
