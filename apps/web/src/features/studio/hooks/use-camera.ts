import { useAtom, useSetAtom } from "jotai";
import { useEffect, useRef } from "react";
import { cameraEnabledAtom, cameraStreamAtom } from "@/atoms/studio-atoms";

export function useCamera() {
  const [enabled, setEnabled] = useAtom(cameraEnabledAtom);
  const setStream = useSetAtom(cameraStreamAtom);
  const streamRef = useRef<MediaStream | null>(null);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: true,
      });
      streamRef.current = stream;
      setStream(stream);
      setEnabled(true);
    } catch (err) {
      console.error("[useCamera] Failed to access camera:", err);
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
