import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import EventEmitter from "./EventEmitter";
import type { Source } from "../sources";

export default class Resources extends EventEmitter {
    sources: Source[];
    items: Record<string, any> = {};
    toLoad: number;
    loaded = 0;
    loaders: { gltfLoader: GLTFLoader };

    constructor(sources: Source[]) {
        super();
        this.sources = sources;
        this.toLoad = sources.length;
        this.loaders = { gltfLoader: new GLTFLoader() };
        this.startLoading();
    }

    startLoading() {
        for (const source of this.sources) {
            if (source.type === "gltfModel") {
                this.loaders.gltfLoader.load(source.path, (file) => {
                    this.sourceLoaded(source, file);
                });
            }
        }
    }

    sourceLoaded(source: Source, file: any) {
        this.items[source.name] = file;
        this.loaded++;
        if (this.loaded === this.toLoad) this.trigger("ready");
    }
}
