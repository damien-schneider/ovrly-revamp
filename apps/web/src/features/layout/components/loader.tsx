import { CircleNotch } from "@phosphor-icons/react";

export default function Loader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <CircleNotch className="size-8 animate-spin" />
    </div>
  );
}
