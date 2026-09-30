import { Howl } from "howler";

// Structure of the sounds we load
export interface SoundManifest {
  music: { [name: string]: string };
  sfx: { [name: string]: string };
}

// Structure of our event details
interface SoundEventDetail {
  name: string;
  fadeDuration?: number;
  volume?: number;
}

declare global {
  interface DocumentEventMap {
    playSfx: CustomEvent<SoundEventDetail>;
    playMusic: CustomEvent<SoundEventDetail>;
    stopMusic: CustomEvent<SoundEventDetail>;
  }
}

export default class SoundManager {
  sfx: Map<string, Howl> = new Map(); // library of sounds, string is the key, Howl is a instance of Howl as a value
  music: Map<string, Howl> = new Map(); // library of music, string is the key, Howl is a instance of Howl as a value
  currentMusic: Howl | null = null;
  currentMusicName: string | null = null;

  constructor() {
    this.setupListeners();
  }

  // Preload our music tracks and sounds
  preload(manifest: SoundManifest) {
    for (const [name, path] of Object.entries(manifest.music)) {
      // convert object with key/value to array, then we destrucutre it([name] is [0] and [path] is [1])
      const sound = new Howl({
        src: [path],
        loop: true,
        volume: 0.3,
      });
      /* console.log("my path: ", sound); */
      this.music.set(name, sound); // insert in the map
    }

    for (const [name, path] of Object.entries(manifest.sfx)) {
      const sound = new Howl({
        src: [path],
        loop: false,
        volume: 1.0,
      });
      this.sfx.set(name, sound);
    }
  }

  setupListeners() {
    window.addEventListener("playSfx", (event) => {
      const detail = (event as CustomEvent<SoundEventDetail>).detail;
      if (!detail?.name) return;

      const sound = this.sfx.get(detail.name); // We get inside de sfx map the right sound by it's key(it's name)

      if (sound) {
        const soundId = sound.play();

        if (detail.volume !== undefined) {
          sound.volume(detail.volume, soundId);
        }
      } else {
        console.warn(`SFX "${detail.name}" not found.`);
      }
    });
    window.addEventListener("playMusic", (event) => {
      const detail = (event as CustomEvent<SoundEventDetail>).detail;
      if (!detail?.name) return;

      if (this.currentMusicName === detail.name) return;

      if (this.currentMusic) {
        this.stopMusic(detail.fadeDuration);
      }

      const sound = this.music.get(detail.name);
      if (sound) {
        console.log("we got sound", sound);
        this.currentMusic = sound;
        this.currentMusicName = detail.name;
        sound.play();

        const targetVolume = detail.volume ?? 0.3;

        sound.fade(0, targetVolume, detail.fadeDuration ?? 1000); // Fade in
      } else {
        console.warn(`Music track "${detail.name}" not found.`);
      }
    });
    window.addEventListener("stopMusic", (event) => {
      const detail = (event as CustomEvent<SoundEventDetail>).detail;
      this.stopMusic(detail?.fadeDuration);
    });
  }

  stopMusic(fadeDuration: number = 1000) {
    if (this.currentMusic) {
      const musicToStop = this.currentMusic;

      this.currentMusic = null;
      this.currentMusicName = null;

      musicToStop.fade(musicToStop.volume(), 0, fadeDuration);

      musicToStop.once("fade", () => {
        musicToStop?.stop();
      });
    }
  }
}
