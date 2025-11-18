import type { ReactNode } from "react";

type ObsOverlayContainerProps = {
  children: ReactNode;
};

export function ObsOverlayContainer({ children }: ObsOverlayContainerProps) {
  return (
    <div className="h-screen w-screen overflow-hidden">
      <div className="size-full">{children}</div>
    </div>
  );
}
