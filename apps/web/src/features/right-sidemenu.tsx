export default function RightSidemenu() {
  // This sidebar was used for legacy overlay settings
  // The new canvas editor has its own properties panel
  return (
    <div className="flex h-full flex-col gap-1">
      <div className="h-full w-72 min-w-72 rounded-xl bg-background-2">
        <div className="flex h-full items-center justify-center p-4">
          <p className="text-muted-foreground text-sm">Settings Panel</p>
        </div>
      </div>
    </div>
  );
}
