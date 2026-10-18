import { useAtomValue } from "jotai";
import { useEffect, useRef } from "react";
import {
  activeSceneAtom,
  cameraStreamAtom,
  screenStreamAtom,
} from "@/atoms/studio-atoms";
import {
  CanvasCompositor,
  type Resolution,
} from "../compositor/canvas-compositor";
import { getSceneById } from "../lib/scene-layouts";

/**
 * Manages the <canvas> compositor — draws camera/screen sources
 * according to the active scene layout.
 */
export function useCompositor(resolution: Resolution = "1080p") {
  const sceneId = useAtomValue(activeSceneAtom);
  const cameraStream = useAtomValue(cameraStreamAtom);
  const screenStream = useAtomValue(screenStreamAtom);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const compositorRef = useRef<CanvasCompositor | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);

  // Initialize compositor when canvas is mounted
  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const compositor = new CanvasCompositor(canvasRef.current, resolution);
    compositorRef.current = compositor;
    compositor.start();

    return () => {
      compositor.destroy();
      compositorRef.current = null;
    };
  }, [resolution]);

  // Update layout when scene changes
  useEffect(() => {
    const compositor = compositorRef.current;
    if (!compositor) {
      return;
    }

    const layout = getSceneById(sceneId);
    compositor.setLayout(layout);
  }, [sceneId]);

  // Bind camera stream to a hidden video element
  useEffect(() => {
    const compositor = compositorRef.current;

    if (cameraStream) {
      if (!cameraVideoRef.current) {
        cameraVideoRef.current = document.createElement("video");
        cameraVideoRef.current.muted = true;
        cameraVideoRef.current.playsInline = true;
        cameraVideoRef.current.autoplay = true;
      }
      cameraVideoRef.current.srcObject = cameraStream;
      cameraVideoRef.current.play().catch(() => {
        // Play may fail if autoplay is blocked
      });
      compositor?.setCameraVideo(cameraVideoRef.current);
    } else {
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = null;
      }
      compositor?.setCameraVideo(null);
    }
  }, [cameraStream]);

  // Bind screen stream to a hidden video element
  useEffect(() => {
    const compositor = compositorRef.current;

    if (screenStream) {
      if (!screenVideoRef.current) {
        screenVideoRef.current = document.createElement("video");
        screenVideoRef.current.muted = true;
        screenVideoRef.current.playsInline = true;
        screenVideoRef.current.autoplay = true;
      }
      screenVideoRef.current.srcObject = screenStream;
      screenVideoRef.current.play().catch(() => {
        // Play may fail if autoplay is blocked
      });
      compositor?.setScreenVideo(screenVideoRef.current);
    } else {
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = null;
      }
      compositor?.setScreenVideo(null);
    }
  }, [screenStream]);

  return {
    canvasRef,
    compositor: compositorRef.current,
  };
}
