import { CircleNotch } from "@phosphor-icons/react";

export default function Loader() {
  return (
    <div className="flex h-full items-center justify-center pt-8">
      <CircleNotch className="animate-spin" />
    </div>
  );
}
