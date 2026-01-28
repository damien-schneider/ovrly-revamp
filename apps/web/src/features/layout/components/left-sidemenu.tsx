import { UserIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import ThemeSwitcher from "@/features/layout/components/theme-switcher";

export default function LeftSidemenu() {
  return (
    <div className="flex h-full flex-col gap-1">
      <div className="flex h-full w-72 min-w-72 flex-col rounded-xl bg-background-2">
        <div className="flex h-full items-center justify-center p-4">
          <p className="text-muted-foreground text-sm">Navigation</p>
        </div>
      </div>
      <div className="flex w-72 min-w-72 flex-col gap-1">
        <ThemeSwitcher />
        <Link className="w-full" to="/account">
          <Button
            className="h-12 w-full justify-start gap-2 rounded-xl bg-background-2"
            variant="ghost"
          >
            <UserIcon size={20} weight="regular" />
            <span>Account</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
