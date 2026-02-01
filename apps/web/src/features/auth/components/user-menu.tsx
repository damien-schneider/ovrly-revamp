import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";

export default function UserMenu() {
  const user = useQuery(api.auth.getCurrentUser);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-10 items-center rounded-xl border bg-background-2 px-4 transition-colors hover:bg-background">
        {user?.name}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-card">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>{user?.email}</DropdownMenuItem>
        <DropdownMenuItem
          className="w-full cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90"
          onClick={() => {
            authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  // Full page reload is required after sign-out per Better Auth docs
                  // to properly reset auth state before signing back in
                  window.location.href = "/login?redirect=/overlays";
                },
              },
            });
          }}
        >
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
