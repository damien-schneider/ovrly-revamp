import { type ChildProcess, spawn } from "node:child_process";

interface FfmpegOptions {
  streamKey: string;
  resolution: "1080p" | "720p";
  framerate: 30 | 60;
  bitrate: number;
  ingestUrl?: string;
}

interface StreamStats {
  fps: number;
  bitrate: number;
  droppedFrames: number;
  totalFrames: number;
  speed: number;
}

const RESOLUTION_MAP = {
  "1080p": "1920x1080",
  "720p": "1280x720",
} as const;

const SIGKILL_TIMEOUT_MS = 5000;

const FPS_REGEX = /fps=\s*([\d.]+)/;
const BITRATE_REGEX = /bitrate=\s*([\d.]+)kbits\/s/;
const FRAME_REGEX = /frame=\s*(\d+)/;
const DROP_REGEX = /drop=\s*(\d+)/;
const SPEED_REGEX = /speed=\s*([\d.]+)x/;

export class FfmpegPipe {
  private process: ChildProcess | null = null;
  private readonly stats: StreamStats = {
    fps: 0,
    bitrate: 0,
    droppedFrames: 0,
    totalFrames: 0,
    speed: 0,
  };
  private startedAt: number | null = null;
  private stderrBuffer = "";

  get isRunning(): boolean {
    return this.process !== null && !this.process.killed;
  }

  get duration(): number {
    if (!this.startedAt) {
      return 0;
    }
    return Math.floor((Date.now() - this.startedAt) / 1000);
  }

  get currentStats(): StreamStats {
    return { ...this.stats };
  }

  start(options: FfmpegOptions): void {
    if (this.isRunning) {
      throw new Error("FFmpeg process is already running");
    }

    const resolution = RESOLUTION_MAP[options.resolution];
    const ingestUrl = options.ingestUrl ?? "rtmp://live.twitch.tv/app";

    // FFmpeg receives WebM (VP8/Opus) from browser MediaRecorder via stdin
    // and re-encodes to H.264/AAC FLV for Twitch RTMP ingest
    const args = [
      // Input from stdin (WebM container from MediaRecorder)
      "-i",
      "pipe:0",
      // Video encoding
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-tune",
      "zerolatency",
      "-b:v",
      `${options.bitrate}k`,
      "-maxrate",
      `${options.bitrate}k`,
      "-bufsize",
      `${options.bitrate * 2}k`,
      "-s",
      resolution,
      "-r",
      `${options.framerate}`,
      "-g",
      `${options.framerate * 2}`, // Keyframe interval = 2 seconds
      "-pix_fmt",
      "yuv420p",
      // Audio encoding
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-ar",
      "44100",
      // Output format
      "-f",
      "flv",
      // Progress/stats output
      "-progress",
      "pipe:2",
      // Output to Twitch RTMP
      `${ingestUrl}/${options.streamKey}`,
    ];

    this.process = spawn("ffmpeg", args, {
      stdio: ["pipe", "pipe", "pipe"],
    });

    this.startedAt = Date.now();

    this.process.stderr?.on("data", (data: Buffer) => {
      this.stderrBuffer += data.toString();
      this.parseStats();
    });

    this.process.on("close", (code) => {
      console.log(`[FFmpeg] Process exited with code ${code}`);
      this.process = null;
      this.startedAt = null;
    });

    this.process.on("error", (err) => {
      console.error("[FFmpeg] Process error:", err.message);
      this.process = null;
      this.startedAt = null;
    });

    console.log(
      `[FFmpeg] Started: ${resolution} @ ${options.framerate}fps, ${options.bitrate}kbps`
    );
  }

  write(chunk: Buffer | Uint8Array): boolean {
    if (!this.process?.stdin?.writable) {
      return false;
    }
    try {
      return this.process.stdin.write(chunk);
    } catch {
      return false;
    }
  }

  async stop(): Promise<void> {
    if (!this.process) {
      return;
    }

    const proc = this.process;

    // Close stdin first to signal end of input
    proc.stdin?.end();

    // Send SIGTERM for graceful shutdown
    proc.kill("SIGTERM");

    // Wait for process to exit, force kill after timeout
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        if (!proc.killed) {
          proc.kill("SIGKILL");
        }
        resolve();
      }, SIGKILL_TIMEOUT_MS);

      proc.on("close", () => {
        clearTimeout(timeout);
        resolve();
      });
    });

    this.process = null;
    this.startedAt = null;
  }

  private parseStats(): void {
    // Parse FFmpeg stderr for progress info
    const lines = this.stderrBuffer.split("\n");

    for (const line of lines) {
      const fpsMatch = FPS_REGEX.exec(line);
      if (fpsMatch?.[1]) {
        this.stats.fps = Number.parseFloat(fpsMatch[1]);
      }

      const bitrateMatch = BITRATE_REGEX.exec(line);
      if (bitrateMatch?.[1]) {
        this.stats.bitrate = Number.parseFloat(bitrateMatch[1]);
      }

      const frameMatch = FRAME_REGEX.exec(line);
      if (frameMatch?.[1]) {
        this.stats.totalFrames = Number.parseInt(frameMatch[1], 10);
      }

      const dropMatch = DROP_REGEX.exec(line);
      if (dropMatch?.[1]) {
        this.stats.droppedFrames = Number.parseInt(dropMatch[1], 10);
      }

      const speedMatch = SPEED_REGEX.exec(line);
      if (speedMatch?.[1]) {
        this.stats.speed = Number.parseFloat(speedMatch[1]);
      }
    }

    // Keep only the last 2000 chars to avoid memory growth
    const MAX_BUFFER_LENGTH = 2000;
    if (this.stderrBuffer.length > MAX_BUFFER_LENGTH) {
      this.stderrBuffer = this.stderrBuffer.slice(-MAX_BUFFER_LENGTH);
    }
  }
}
