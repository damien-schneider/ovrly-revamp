"use client";

import { useTheme } from "next-themes";
import { type ReactNode, useEffect, useState } from "react";
import { flushSync } from "react-dom";

type ThemeSelection = "light" | "dark" | "system";
type Resolved = "light" | "dark";
type Direction = "btt" | "ttb" | "ltr" | "rtl";

type ChildrenRender =
  | ReactNode
  | ((state: {
      resolved: Resolved;
      effective: ThemeSelection;
      toggleTheme: (theme: ThemeSelection) => void;
    }) => ReactNode);

function getSystemEffective(): Resolved {
  if (typeof window === "undefined") {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getClipKeyframes(direction: Direction): [string, string] {
  switch (direction) {
    case "ltr":
      return ["inset(0 100% 0 0)", "inset(0 0 0 0)"];
    case "rtl":
      return ["inset(0 0 0 100%)", "inset(0 0 0 0)"];
    case "ttb":
      return ["inset(0 0 100% 0)", "inset(0 0 0 0)"];
    case "btt":
      return ["inset(100% 0 0 0)", "inset(0 0 0 0)"];
    default:
      return ["inset(0 100% 0 0)", "inset(0 0 0 0)"];
  }
}

type ThemeTogglerProps = {
  direction?: Direction;
  onImmediateChange?: (theme: ThemeSelection) => void;
  children?: ChildrenRender;
};

function ThemeToggler({
  onImmediateChange,
  direction = "ltr",
  children,
}: ThemeTogglerProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [preview, setPreview] = useState<null | {
    effective: ThemeSelection;
    resolved: Resolved;
  }>(null);
  const [current, setCurrent] = useState<{
    effective: ThemeSelection;
    resolved: Resolved;
  }>({
    effective: (theme as ThemeSelection) || "system",
    resolved: (resolvedTheme as Resolved) || "light",
  });

  useEffect(() => {
    const effective = (theme as ThemeSelection) || "system";
    const resolved = (resolvedTheme as Resolved) || getSystemEffective();
    setCurrent({ effective, resolved });
  }, [theme, resolvedTheme]);

  useEffect(() => {
    if (
      preview &&
      theme === preview.effective &&
      resolvedTheme === preview.resolved
    ) {
      setPreview(null);
    }
  }, [theme, resolvedTheme, preview]);

  const [fromClip, toClip] = getClipKeyframes(direction);

  const toggleTheme = async (newTheme: ThemeSelection) => {
    const resolved = newTheme === "system" ? getSystemEffective() : newTheme;

    setCurrent({ effective: newTheme, resolved });
    onImmediateChange?.(newTheme);

    if (newTheme === "system" && resolved === resolvedTheme) {
      setTheme(newTheme);
      return;
    }

    if (!document.startViewTransition) {
      flushSync(() => {
        setPreview({ effective: newTheme, resolved });
      });
      setTheme(newTheme);
      return;
    }

    await document.startViewTransition(() => {
      flushSync(() => {
        setPreview({ effective: newTheme, resolved });
        document.documentElement.classList.toggle("dark", resolved === "dark");
      });
    }).ready;

    document.documentElement
      .animate(
        { clipPath: [fromClip, toClip] },
        {
          duration: 700,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        }
      )
      .finished.finally(() => {
        setTheme(newTheme);
      });
  };

  return (
    <>
      {typeof children === "function"
        ? children({
            effective: current.effective,
            resolved: current.resolved,
            toggleTheme,
          })
        : children}
      <style>
        {
          "::view-transition-old(root), ::view-transition-new(root){animation:none;mix-blend-mode:normal;}"
        }
      </style>
    </>
  );
}

export {
  ThemeToggler,
  type ThemeTogglerProps,
  type ThemeSelection,
  type Resolved,
  type Direction,
};
