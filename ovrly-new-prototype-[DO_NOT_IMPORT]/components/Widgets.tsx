import type React from "react";
import { useEffect, useRef } from "react";
import {
  type ChatElement,
  ElementType,
  type EmoteWallElement,
  type OverlayElement,
  type ProgressBarElement,
  type TimerElement,
  type WebcamElement,
} from "../types";

export const ElementRenderer: React.FC<{ element: OverlayElement }> = ({
  element,
}) => {
  if (!element.visible) {
    return null;
  }

  switch (element.type) {
    case ElementType.OVERLAY:
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: (element as any).backgroundColor || "transparent",
            position: "relative",
            border: "2px solid rgba(37, 99, 235, 0.1)",
            borderRadius: "4px",
            boxShadow: "inset 0 0 10px rgba(0,0,0,0.02)",
          }}
        >
          <div className="absolute top-2 left-2 rounded bg-blue-500 px-2 py-0.5 font-bold text-[10px] text-white uppercase tracking-wider opacity-60">
            {element.name}
          </div>
        </div>
      );
    case ElementType.BOX:
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: element.backgroundColor,
            borderColor: element.borderColor,
            borderWidth: element.borderWidth,
            borderStyle: "solid",
            borderRadius: element.borderRadius,
            opacity: element.opacity,
          }}
        />
      );
    case ElementType.TEXT:
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent:
              element.textAlign === "center"
                ? "center"
                : element.textAlign === "right"
                  ? "flex-end"
                  : "flex-start",
            color: element.color,
            fontFamily: element.fontFamily,
            fontSize: element.fontSize,
            fontWeight: element.fontWeight,
            opacity: element.opacity,
            whiteSpace: "pre-wrap",
            overflow: "hidden",
          }}
        >
          {element.content}
        </div>
      );
    case ElementType.IMAGE:
      return (
        <img
          alt="overlay"
          src={element.src}
          style={{
            width: "100%",
            height: "100%",
            objectFit: element.objectFit,
            opacity: element.opacity,
            pointerEvents: "none",
          }}
        />
      );
    case ElementType.CHAT:
      return <ChatWidget element={element} />;
    case ElementType.EMOTE_WALL:
      return <EmoteWallWidget element={element} />;
    case ElementType.WEBCAM:
      return <WebcamWidget element={element} />;
    case ElementType.TIMER:
      return <TimerWidget element={element} />;
    case ElementType.PROGRESS:
      return <ProgressBarWidget element={element} />;
    default:
      return null;
  }
};

const ChatWidget: React.FC<{ element: ChatElement }> = ({ element }) => {
  const { style, mockMessages } = element;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: style.backgroundColor,
        borderRadius: style.borderRadius,
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        overflow: "hidden",
        fontFamily: style.fontFamily,
        color: style.textColor,
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      }}
    >
      {mockMessages.map((msg, idx) => (
        <div
          className="mb-2 flex items-start gap-2 text-sm last:mb-0"
          key={idx}
        >
          <span
            style={{
              color: style.usernameColor || msg.color,
              fontWeight: "bold",
            }}
          >
            {msg.user}:
          </span>
          <span style={{ fontSize: style.fontSize }}>{msg.text}</span>
        </div>
      ))}
    </div>
  );
};

const EmoteWallWidget: React.FC<{ element: EmoteWallElement }> = ({
  element,
}) => {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl border-2 border-gray-200 border-dashed bg-gray-50/50">
      <span className="absolute top-2 left-2 font-bold font-mono text-[10px] text-gray-400 uppercase">
        Emote Wall Region
      </span>
      <div className="absolute inset-0 flex flex-wrap content-end gap-4 p-4 opacity-50">
        {Array.from({ length: Math.min(10, element.density * 2) }).map(
          (_, i) => (
            <div
              className="animate-bounce text-2xl"
              key={i}
              style={{ animationDuration: `${3 / element.speed}s` }}
            >
              {["🔥", "❤️", "😂", "👍"][i % 4]}
            </div>
          )
        )}
      </div>
    </div>
  );
};

const WebcamWidget: React.FC<{ element: WebcamElement }> = ({ element }) => {
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
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    };

    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gray-100 text-gray-500"
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
        style={{ transform: "scaleX(-1)" }} // Mirror the camera for natural feel
      />
      <div className="absolute top-2 left-2 rounded bg-black/40 px-2 py-0.5 font-bold text-[9px] text-white uppercase tracking-widest backdrop-blur-sm">
        Live Feed
      </div>
    </div>
  );
};

const TimerWidget: React.FC<{ element: TimerElement }> = ({ element }) => {
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{
        fontFamily: element.fontFamily,
        fontSize: element.fontSize,
        color: element.color,
        fontWeight: "bold",
      }}
    >
      {element.mode === "countdown" ? "10:00" : "00:00"}
    </div>
  );
};

const ProgressBarWidget: React.FC<{ element: ProgressBarElement }> = ({
  element,
}) => {
  return (
    <div
      className="relative flex h-full w-full items-center"
      style={{
        backgroundColor: element.backgroundColor,
        borderRadius: element.borderRadius,
        overflow: "hidden",
        padding: "4px",
      }}
    >
      <div
        style={{
          width: `${element.progress}%`,
          height: "100%",
          backgroundColor: element.barColor,
          borderRadius: element.borderRadius / 2,
          transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
    </div>
  );
};
