// apps/user/src/lib/audio/BgmPlayer.ts

import type { BgmTrack } from "./bgmRoutes";

export class BgmPlayer {
  private audio: HTMLAudioElement | null = null;
  private currentSrc: string | null = null;
  private currentLoop = false;
  private desired: BgmTrack | null = null;

  private unblockHandler: (() => void) | null = null;

  private ensureAudio(): HTMLAudioElement {
    if (this.audio) return this.audio;

    const a = new Audio();
    a.preload = "auto";
    a.loop = false;
    a.volume = 0.5;
    (a as any).playsInline = true;

    this.audio = a;
    return a;
  }

  async setTrack(track: BgmTrack | null): Promise<void> {
    this.desired = track;

    if (!track) {
      this.stop();
      return;
    }

    const a = this.ensureAudio();

    const needSrcChange = this.currentSrc !== track.src;
    const needLoopChange = this.currentLoop !== track.loop;

    a.volume = clamp01(track.volume);
    a.loop = track.loop;

    if (needSrcChange) {
      a.pause();
      safeSetCurrentTime(a, 0);

      a.src = track.src;

      // src変更直後に play() が効かないケースがあるので load() を明示
      try {
        a.load();
      } catch {}

      this.currentSrc = track.src;
    }

    if (needLoopChange) this.currentLoop = track.loop;

    await this.tryPlayWithFallback();
  }

  stop(): void {
    const a = this.audio;
    if (!a) return;

    this.detachUnblockListeners();
    a.pause();
    safeSetCurrentTime(a, 0);

    this.currentSrc = null;
    this.currentLoop = false;
    this.desired = null;
  }

  private async tryPlayWithFallback(): Promise<void> {
    const a = this.audio;
    if (!a || !this.desired) return;

    this.detachUnblockListeners();

    try {
      await a.play();
    } catch {
      this.attachUnblockListeners();
    }
  }

  private attachUnblockListeners(): void {
    if (this.unblockHandler) return;

    const handler = () => {
      this.detachUnblockListeners();
      void this.tryPlayWithFallback();
    };

    this.unblockHandler = handler;

    window.addEventListener("pointerdown", handler, {
      once: true,
      passive: true,
    });
    window.addEventListener("keydown", handler, { once: true });
    window.addEventListener("touchstart", handler, {
      once: true,
      passive: true,
    });
  }

  private detachUnblockListeners(): void {
    if (!this.unblockHandler) return;
    const handler = this.unblockHandler;
    this.unblockHandler = null;

    window.removeEventListener("pointerdown", handler);
    window.removeEventListener("keydown", handler);
    window.removeEventListener("touchstart", handler);
  }
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0.5;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

function safeSetCurrentTime(a: HTMLAudioElement, t: number) {
  try {
    a.currentTime = t;
  } catch {}
}

export const bgmPlayer = new BgmPlayer();
