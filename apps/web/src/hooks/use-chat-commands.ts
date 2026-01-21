import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useEffect, useRef } from "react";
import { useProviderData } from "@/hooks/use-provider-token";
import { type ChatMessage, useTwitchChat } from "@/hooks/use-twitch-chat";

interface CommandTriggerLog {
  commandId: string;
  trigger: string;
  timestamp: number;
  username: string;
}

interface UseChatCommandsOptions {
  channel: string | null | undefined;
  enabled?: boolean;
  onCommandTriggered?: (log: CommandTriggerLog) => void;
}

interface UseChatCommandsReturn {
  isConnected: boolean;
  isListening: boolean;
  error: string | null;
  triggerLogs: CommandTriggerLog[];
}

interface Command {
  _id: Id<"commands">;
  trigger: string;
  response: string;
  enabled: boolean;
}

const MAX_TRIGGER_LOGS = 50;
const COMMAND_COOLDOWN_MS = 3000;

function matchesTrigger(messageText: string, trigger: string): boolean {
  const isExactMatch = messageText === trigger;
  const isStartMatch =
    messageText.startsWith(trigger) &&
    messageText.charAt(trigger.length) === " ";
  return isExactMatch || isStartMatch;
}

function findMatchingCommand(
  messageText: string,
  commands: Command[],
  lastTriggerTimes: Record<string, number>
): Command | null {
  const now = Date.now();

  for (const command of commands) {
    if (!command.enabled) {
      continue;
    }

    const trigger = command.trigger.toLowerCase();

    if (!matchesTrigger(messageText, trigger)) {
      continue;
    }

    // Check cooldown
    const lastTrigger = lastTriggerTimes[command._id];
    if (lastTrigger && now - lastTrigger < COMMAND_COOLDOWN_MS) {
      continue;
    }

    return command;
  }

  return null;
}

export function useChatCommands({
  channel,
  enabled = true,
  onCommandTriggered,
}: UseChatCommandsOptions): UseChatCommandsReturn {
  const { providerToken, twitchUsername } = useProviderData();
  const commands = useQuery(api.commands.list);
  const triggerLogsRef = useRef<CommandTriggerLog[]>([]);
  const lastTriggerTimeRef = useRef<Record<string, number>>({});

  const handleMessage = (message: ChatMessage) => {
    if (!commands || commands.length === 0) {
      return;
    }

    const messageText = message.message.trim().toLowerCase();
    const command = findMatchingCommand(
      messageText,
      commands,
      lastTriggerTimeRef.current
    );

    if (!command) {
      return;
    }

    const now = Date.now();

    // Update cooldown
    lastTriggerTimeRef.current[command._id] = now;

    // Send response
    sendMessage(command.response);

    // Log the trigger
    const log: CommandTriggerLog = {
      commandId: command._id,
      trigger: command.trigger,
      timestamp: now,
      username: message.displayName || message.username,
    };

    triggerLogsRef.current = [
      log,
      ...triggerLogsRef.current.slice(0, MAX_TRIGGER_LOGS - 1),
    ];

    onCommandTriggered?.(log);
  };

  const { isConnected, error, sendMessage } = useTwitchChat({
    channel,
    accessToken: providerToken,
    username: twitchUsername,
    enabled: enabled && Boolean(channel && providerToken && twitchUsername),
    onMessage: handleMessage,
  });

  // Clear cooldowns when component unmounts
  useEffect(
    () => () => {
      lastTriggerTimeRef.current = {};
    },
    []
  );

  const isListening =
    isConnected && Boolean(commands && commands.length > 0 && enabled);

  return {
    isConnected,
    isListening,
    error,
    triggerLogs: triggerLogsRef.current,
  };
}

export type {
  CommandTriggerLog,
  UseChatCommandsOptions,
  UseChatCommandsReturn,
};
