import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  streamDurationAtom,
  streamHealthAtom,
  streamStatusAtom,
} from "@/atoms/studio-atoms";
import { env } from "@/env";

const RECORDER_TIMESLICE_MS = 1000;
const HEALTH_POLL_INTERVAL_MS = 3000;
const DURATION_INTERVAL_MS = 1000;
const PROTOCOL_REGEX = /^https?:\/\//;

interface StreamConfig {
  streamKey: string;
  resolution: "1080p" | "720p";
  framerate: 30 | 60;
  bitrate: number;
  profileId: string;
}

export function useStream() {
  const setStatus = useSetAtom(streamStatusAtom);
  const setDuration = useSetAtom(streamDurationAtom);
  const setHealth = useSetAtom(streamHealthAtom);
  const streamStatus = useAtomValue(streamStatusAtom);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const healthIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const configRef = useRef<StreamConfig | null>(null);

  const getRelayUrl = () => {
    return env.VITE_STREAM_RELAY_URL ?? "http://localhost:3003";
  };

  const getApiSecret = () => {
    return env.VITE_BOT_API_SECRET ?? "";
  };

  const goLive = async (outputStream: MediaStream, config: StreamConfig) => {
    if (!config.streamKey) {
      toast.error("Stream key is required. Configure it in Settings.");
      return;
    }

    configRef.current = config;
    setStatus("connecting");

    const relayUrl = getRelayUrl();
    const secret = getApiSecret();

    try {
      // 1. Tell relay to start FFmpeg process
      const startRes = await fetch(
        `${relayUrl}/streams/${config.profileId}/start`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: secret ? `Bearer ${secret}` : "",
          },
          body: JSON.stringify({
            streamKey: config.streamKey,
            resolution: config.resolution,
            framerate: config.framerate,
            bitrate: config.bitrate,
          }),
        }
      );

      if (!startRes.ok) {
        const err = await startRes.json();
        throw new Error(err.error ?? "Failed to start stream relay");
      }

      // 2. Open WebSocket for media chunks
      const wsProtocol = relayUrl.startsWith("https") ? "wss" : "ws";
      const wsHost = relayUrl.replace(PROTOCOL_REGEX, "");
      const wsUrl = `${wsProtocol}://${wsHost}/streams/${config.profileId}/ws?token=${secret}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      await new Promise<void>((resolve, reject) => {
        ws.onopen = () => resolve();
        ws.onerror = () => reject(new Error("WebSocket connection failed"));
        // Timeout after 10s
        setTimeout(
          () => reject(new Error("WebSocket connection timeout")),
          10_000
        );
      });

      // 3. Start MediaRecorder → pipe chunks to WebSocket
      const mimeType = MediaRecorder.isTypeSupported(
        "video/webm;codecs=vp8,opus"
      )
        ? "video/webm;codecs=vp8,opus"
        : "video/webm";

      const recorder = new MediaRecorder(outputStream, {
        mimeType,
        videoBitsPerSecond: config.bitrate * 1000,
      });
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
          ws.send(e.data);
        }
      };

      recorder.onerror = () => {
        toast.error("Recording error — stream stopped");
        stopStream();
      };

      recorder.start(RECORDER_TIMESLICE_MS);

      // 4. Start duration timer
      let elapsed = 0;
      setDuration(0);
      durationIntervalRef.current = setInterval(() => {
        elapsed += 1;
        setDuration(elapsed);
      }, DURATION_INTERVAL_MS);

      // 5. Start health polling
      healthIntervalRef.current = setInterval(async () => {
        try {
          const res = await fetch(`${relayUrl}/streams/${config.profileId}`, {
            headers: {
              Authorization: secret ? `Bearer ${secret}` : "",
            },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.stats) {
              setHealth({
                fps: data.stats.fps ?? 0,
                bitrate: data.stats.bitrate ?? 0,
                droppedFrames: data.stats.droppedFrames ?? 0,
              });
            }
          }
        } catch {
          // Silent — health check failure is not critical
        }
      }, HEALTH_POLL_INTERVAL_MS);

      // Handle WS close
      ws.onclose = () => {
        if (recorderRef.current?.state === "recording") {
          toast.error("Connection to relay lost — stream stopped");
          stopStream();
        }
      };

      setStatus("live");
      toast.success("You are now live!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Failed to go live: ${message}`);
      setStatus("error");
      cleanup();
    }
  };

  const stopStream = async () => {
    const config = configRef.current;
    cleanup();

    // Tell relay to stop FFmpeg
    if (config) {
      try {
        const relayUrl = getRelayUrl();
        const secret = getApiSecret();
        await fetch(`${relayUrl}/streams/${config.profileId}/stop`, {
          method: "POST",
          headers: {
            Authorization: secret ? `Bearer ${secret}` : "",
          },
        });
      } catch {
        // Best effort
      }
    }

    setStatus("idle");
    setDuration(0);
    setHealth({ fps: 0, bitrate: 0, droppedFrames: 0 });
    toast.info("Stream ended");
  };

  const cleanup = () => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
    recorderRef.current = null;

    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (healthIntervalRef.current) {
      clearInterval(healthIntervalRef.current);
      healthIntervalRef.current = null;
    }
  };

  // Cleanup on unmount
  // biome-ignore lint/correctness/useExhaustiveDependencies: cleanup runs once on unmount only
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  return {
    goLive,
    stopStream,
    streamStatus,
  };
}
