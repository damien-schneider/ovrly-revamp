"use client";

import { Monitor, Moon, Sun } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ThemeToggler,
  type ThemeSelection,
} from "@/components/animate-ui/primitives/effects/theme-toggler";

const themes: Array<{
  value: ThemeSelection;
  label: string;
  icon: typeof Monitor;
}> = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

export default function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-12 w-full items-center justify-center gap-1 rounded-xl bg-background-2">
        <div className="h-8 w-8 animate-pulse rounded bg-background" />
      </div>
    );
  }

  return (
    <ThemeToggler direction="ltr">
      {({ effective, toggleTheme }) => (
        <div className="flex h-12 w-full items-center justify-center gap-1 rounded-xl bg-background-2 p-1">
          {themes.map(({ value, label, icon: Icon }) => {
            const isActive = effective === value;
            return (
              <Button
                className="flex h-full flex-1 items-center justify-center gap-1.5"
                key={value}
                onClick={() => toggleTheme(value)}
                size="sm"
                title={label}
                variant={isActive ? "default" : "ghost"}
              >
                <Icon size={16} weight={isActive ? "fill" : "regular"} />
                <span className="text-xs">{label}</span>
              </Button>
            );
          })}
        </div>
      )}
    </ThemeToggler>
  );
}
