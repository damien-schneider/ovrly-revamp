import { useAtom, useSetAtom } from "jotai";
import { useEffect, useRef } from "react";
import { screenEnabledAtom, screenStreamAtom } from "@/atoms/studio-atoms";

export function useScreenShare() {
  const [enabled, setEnabled] = useAtom(screenEnabledAtom);
  const setStream = useSetAtom(screenStreamAtom);
  const streamRef = useRef<MediaStream | null>(null);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: true,
      });

      // Detect when user clicks "Stop sharing" in the browser's UI
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.addEventListener("ended", () => {
          stop();
        });
      }

      streamRef.current = stream;
      setStream(stream);
      setEnabled(true);
    } catch (err) {
      // User cancelled the share picker — not an error
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        return;
      }
      console.error("[useScreenShare] Failed to share screen:", err);
      setEnabled(false);
      throw err;
    }
  };

  const stop = () => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    setStream(null);
    setEnabled(false);
  };

  const toggle = async () => {
    if (enabled) {
      stop();
    } else {
      await start();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) {
          track.stop();
        }
        streamRef.current = null;
      }
    };
  }, []);

  return { enabled, start, stop, toggle, stream: streamRef.current };
}
