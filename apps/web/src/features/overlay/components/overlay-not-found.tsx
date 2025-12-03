import { AlertCircle } from "lucide-react";

export function OverlayNotFound() {
  return (
    <div className="flex w-fit flex-col items-center gap-3 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="size-6 text-destructive" />
      </div>
      <p className="font-medium text-muted-foreground">Overlay not found</p>
    </div>
  );
}
