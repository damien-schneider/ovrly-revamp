import { PaperPlaneRight } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProviderData } from "@/features/auth/hooks/use-provider-token";
import { useTwitchChat } from "@/features/twitch/hooks/use-twitch-chat";
import { cn } from "@/lib/utils";

export function ChatPanel() {
  const {
    providerToken,
    twitchUsername,
    isLoading: isLoadingAuth,
  } = useProviderData();
  const [messageInput, setMessageInput] = useState("");

  const { messages, isConnected, error, sendMessage } = useTwitchChat({
    channel: twitchUsername,
    accessToken: providerToken,
    username: twitchUsername,
    enabled: Boolean(twitchUsername),
  });

  const handleSend = () => {
    const trimmed = messageInput.trim();
    if (!trimmed) {
      return;
    }
    sendMessage(trimmed);
    setMessageInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getEmptyMessage = () => {
    if (twitchUsername) {
      return "Connecting to chat...";
    }
    return "Connect your Twitch account to see chat";
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-border/50 border-b px-3 py-2">
        <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
          Chat
        </h3>
        <div className="flex items-center gap-1.5">
          {isConnected && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-500">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Live
            </span>
          )}
          {isConnected || error || isLoadingAuth ? null : (
            <span className="text-[10px] text-muted-foreground">
              Disconnected
            </span>
          )}
          {error && <span className="text-[10px] text-red-400">Error</span>}
          {isLoadingAuth && (
            <span className="text-[10px] text-muted-foreground">
              Connecting...
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-3 py-2">
        <div className="flex flex-col gap-1.5">
          {messages.length === 0 && (
            <div className="py-8 text-center text-muted-foreground text-xs">
              {isConnected ? "Waiting for messages..." : getEmptyMessage()}
            </div>
          )}
          {messages.map((msg) => (
            <div className="text-sm leading-relaxed" key={msg.id}>
              <span
                className="font-semibold"
                style={{ color: msg.color ?? "#a855f7" }}
              >
                {msg.displayName ?? msg.username}
              </span>
              <span className="text-muted-foreground">: </span>
              <span className="text-foreground">{msg.message}</span>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-border/50 border-t p-2">
        <div className="flex gap-1.5">
          <Input
            className={cn("h-8 text-xs", !isConnected && "opacity-50")}
            disabled={!isConnected}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isConnected ? "Send a message..." : "Connect to chat first"
            }
            value={messageInput}
          />
          <Button
            className="h-8 w-8 shrink-0"
            disabled={!(isConnected && messageInput.trim())}
            onClick={handleSend}
            size="icon"
            variant="ghost"
          >
            <PaperPlaneRight className="h-4 w-4" weight="fill" />
          </Button>
        </div>
      </div>
    </div>
  );
}
