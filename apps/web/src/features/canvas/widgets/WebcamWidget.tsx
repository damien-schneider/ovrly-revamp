import { useEffect, useRef } from "react";
import type { WebcamElement } from "@/features/canvas/types";

interface WebcamWidgetProps {
  element: WebcamElement;
  isLiveView: boolean;
}

export function WebcamWidget({ element, isLiveView }: WebcamWidgetProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        // Camera not available or permission denied - silent fail for preview
      }
    };

    startCamera();
    return () => {
      if (stream) {
        for (const track of stream.getTracks()) {
          track.stop();
        }
      }
    };
  }, []);

  return (
    <div
      className={
        isLiveView
          ? "relative flex h-full w-full items-center justify-center overflow-hidden"
          : "relative flex h-full w-full items-center justify-center overflow-hidden bg-gray-100 text-gray-500"
      }
      style={{
        borderRadius: element.shape === "circle" ? "50%" : element.borderRadius,
        border: `${element.borderWidth}px solid ${element.borderColor}`,
        boxShadow: `0 4px ${element.shadowBlur}px ${element.shadowColor}`,
      }}
    >
      <video
        autoPlay
        className="absolute inset-0 h-full w-full object-cover"
        muted
        playsInline
        ref={videoRef}
        style={{ transform: "scaleX(-1)" }}
      />
      {!isLiveView && (
        <div className="absolute top-2 left-2 rounded bg-black/40 px-2 py-0.5 font-bold text-[9px] text-white uppercase tracking-widest backdrop-blur-sm">
          Live Feed
        </div>
      )}
    </div>
  );
}
