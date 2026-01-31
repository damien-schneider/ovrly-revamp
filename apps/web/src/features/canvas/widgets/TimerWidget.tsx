import { useEffect, useRef, useState } from "react";
import type { TimerElement } from "@/features/canvas/types";

interface TimerWidgetProps {
  element: TimerElement;
}

export function TimerWidget({ element }: TimerWidgetProps) {
  const [timeDisplay, setTimeDisplay] = useState("00:00:00");
  const startTimeRef = useRef<number>(Date.now());
  const elapsedRef = useRef<number>(element.elapsedMs || 0);

  const {
    style = {
      showDays: false,
      showHours: true,
      showMinutes: true,
      showSeconds: true,
      separator: ":",
      padNumbers: true,
      completedText: "00:00",
      backgroundColor: "transparent",
      borderRadius: 0,
      padding: 0,
    },
  } = element;

  useEffect(() => {
    const formatNumber = (n: number) =>
      style.padNumbers
        ? String(Math.floor(n)).padStart(2, "0")
        : String(Math.floor(n));

    const updateTimer = () => {
      let totalSeconds: number;

      if (element.mode === "stopwatch") {
        if (element.isRunning) {
          const elapsed =
            Date.now() - startTimeRef.current + elapsedRef.current;
          totalSeconds = Math.floor(elapsed / 1000);
        } else {
          totalSeconds = Math.floor(elapsedRef.current / 1000);
        }
      } else if (element.mode === "countdown") {
        const target = new Date(element.targetDate).getTime();
        const diff = target - Date.now();
        totalSeconds = Math.max(0, Math.floor(diff / 1000));
      } else {
        // countup
        const start = new Date(element.targetDate).getTime();
        totalSeconds = Math.max(0, Math.floor((Date.now() - start) / 1000));
      }

      const days = Math.floor(totalSeconds / 86_400);
      const hours = Math.floor((totalSeconds % 86_400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const parts: string[] = [];
      if (style.showDays && days > 0) {
        parts.push(formatNumber(days));
      }
      if (style.showHours) {
        parts.push(formatNumber(hours));
      }
      if (style.showMinutes) {
        parts.push(formatNumber(minutes));
      }
      if (style.showSeconds) {
        parts.push(formatNumber(seconds));
      }

      const display = parts.join(style.separator);
      setTimeDisplay(
        totalSeconds === 0 && element.mode === "countdown"
          ? style.completedText
          : display
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [element, style]);

  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{
        fontFamily: element.fontFamily,
        fontSize: element.fontSize,
        color: element.color,
        fontWeight: "bold",
        backgroundColor: style.backgroundColor,
        borderRadius: style.borderRadius,
        padding: style.padding,
      }}
    >
      {timeDisplay}
    </div>
  );
}
