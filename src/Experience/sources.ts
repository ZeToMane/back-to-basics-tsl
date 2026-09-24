export interface Source {
    name: string;
    type: "gltfModel";
    path: string;
}

export default [
    {
        name: "sceneModel",
        type: "gltfModel",
        path: "/assets/terrain.glb",
    },
] as Source[];
