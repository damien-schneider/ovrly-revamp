import type { SceneLayout } from "../lib/scene-layouts";

const RESOLUTIONS = {
  "1080p": { width: 1920, height: 1080 },
  "720p": { width: 1280, height: 720 },
} as const;

export type Resolution = keyof typeof RESOLUTIONS;

export class CanvasCompositor {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private animationId: number | null = null;
  private layout: SceneLayout | null = null;
  private cameraVideo: HTMLVideoElement | null = null;
  private screenVideo: HTMLVideoElement | null = null;

  constructor(canvas: HTMLCanvasElement, resolution: Resolution = "1080p") {
    this.canvas = canvas;

    const { width, height } = RESOLUTIONS[resolution];
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get 2D canvas context");
    }
    this.ctx = ctx;
  }

  setResolution(resolution: Resolution): void {
    const { width, height } = RESOLUTIONS[resolution];
    this.canvas.width = width;
    this.canvas.height = height;
  }

  setLayout(layout: SceneLayout): void {
    this.layout = layout;
  }

  setCameraVideo(video: HTMLVideoElement | null): void {
    this.cameraVideo = video;
  }

  setScreenVideo(video: HTMLVideoElement | null): void {
    this.screenVideo = video;
  }

  start(): void {
    if (this.animationId !== null) {
      return;
    }
    this.render();
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  getOutputStream(fps: number): MediaStream {
    return this.canvas.captureStream(fps);
  }

  private readonly render = (): void => {
    const { width, height } = this.canvas;
    const ctx = this.ctx;

    // Clear canvas with black background
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, width, height);

    if (!this.layout) {
      this.animationId = requestAnimationFrame(this.render);
      return;
    }

    // Draw screen share (behind camera for PiP layouts)
    if (this.layout.screen.visible && this.screenVideo) {
      this.drawSource(
        this.screenVideo,
        this.layout.screen.x * width,
        this.layout.screen.y * height,
        this.layout.screen.w * width,
        this.layout.screen.h * height
      );
    }

    // Draw chat placeholder area (will be composited by the view,
    // but we draw a subtle bg so the layout is visible in preview)
    if (this.layout.chat.visible) {
      const cx = this.layout.chat.x * width;
      const cy = this.layout.chat.y * height;
      const cw = this.layout.chat.w * width;
      const ch = this.layout.chat.h * height;
      ctx.fillStyle = "rgba(30, 30, 30, 0.8)";
      ctx.beginPath();
      ctx.roundRect(cx, cy, cw, ch, 12);
      ctx.fill();

      // "Chat" label
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.font = `${Math.round(ch * 0.04)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Chat", cx + cw / 2, cy + ch / 2);
    }

    // Draw camera (on top for PiP)
    if (this.layout.camera.visible && this.cameraVideo) {
      this.drawSource(
        this.cameraVideo,
        this.layout.camera.x * width,
        this.layout.camera.y * height,
        this.layout.camera.w * width,
        this.layout.camera.h * height
      );
    }

    this.animationId = requestAnimationFrame(this.render);
  };

  private drawSource(
    video: HTMLVideoElement,
    dx: number,
    dy: number,
    dw: number,
    dh: number
  ): void {
    if (video.readyState < video.HAVE_CURRENT_DATA) {
      return;
    }

    // Cover-fit: scale video to fill destination while maintaining aspect ratio
    const videoAspect = video.videoWidth / video.videoHeight;
    const destAspect = dw / dh;

    let sx = 0;
    let sy = 0;
    let sw = video.videoWidth;
    let sh = video.videoHeight;

    if (videoAspect > destAspect) {
      // Video is wider — crop sides
      sw = video.videoHeight * destAspect;
      sx = (video.videoWidth - sw) / 2;
    } else {
      // Video is taller — crop top/bottom
      sh = video.videoWidth / destAspect;
      sy = (video.videoHeight - sh) / 2;
    }

    this.ctx.drawImage(video, sx, sy, sw, sh, dx, dy, dw, dh);
  }

  destroy(): void {
    this.stop();
    this.cameraVideo = null;
    this.screenVideo = null;
    this.layout = null;
  }
}
