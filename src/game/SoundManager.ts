export class SoundManager {
  private bgm: HTMLAudioElement | null = null;
  private isMuted: boolean = false;

  constructor() {}

  playBGM(url: string) {
    if (this.bgm) {
      this.bgm.pause();
      this.bgm = null;
    }

    this.bgm = new Audio(url);
    this.bgm.loop = true;
    this.bgm.volume = 0.5;
    
    // Play with user interaction handling
    const playPromise = this.bgm.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.warn("BGM play failed, waiting for user interaction:", error);
        // Retry on first click
        const retry = () => {
          if (this.bgm) {
            this.bgm.play();
            window.removeEventListener('click', retry);
          }
        };
        window.addEventListener('click', retry);
      });
    }
  }

  stopBGM() {
    if (this.bgm) {
      this.bgm.pause();
      this.bgm = null;
    }
  }

  setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.bgm) {
      this.bgm.muted = muted;
    }
  }
}

export const soundManager = new SoundManager();
