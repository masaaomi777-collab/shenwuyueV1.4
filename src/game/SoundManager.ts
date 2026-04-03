export class SoundManager {
  private bgm: HTMLAudioElement | null = null;
  private isMuted: boolean = false;

  constructor() {}

  playBGM(url: string) {
    if (this.bgm) {
      this.bgm.pause();
      this.bgm = null;
    }

    this.bgm = new Audio();
    this.bgm.loop = true;
    this.bgm.volume = 0.5;
    
    // Check if the browser thinks it can play this format
    const canPlay = this.bgm.canPlayType('audio/wav');
    console.log(`[SoundManager] canPlayType('audio/wav'): ${canPlay}`);

    this.bgm.onerror = (e) => {
      console.error(`[SoundManager] Audio error for ${url}:`, e);
      if (this.bgm && this.bgm.error) {
        console.error(`[SoundManager] Error code: ${this.bgm.error.code}`);
        console.error(`[SoundManager] Error message: ${this.bgm.error.message}`);
      }
    };
    
    this.bgm.src = url;
    this.bgm.load();
    
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
