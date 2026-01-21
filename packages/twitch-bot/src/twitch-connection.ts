// Twitch IRC WebSocket connection manager
// Maintains persistent connections to Twitch chat for multiple channels

const TWITCH_IRC_URL = "wss://irc-ws.chat.twitch.tv:443";
const RECONNECT_BASE_DELAY_MS = 1000;
const RECONNECT_MAX_DELAY_MS = 30_000;
const MAX_RECONNECT_ATTEMPTS = 10;
const AUTH_DELAY_MS = 100;
const PING_INTERVAL_MS = 60_000;
const MS_PER_SECOND = 1000;

interface ChatMessage {
  id: string;
  username: string;
  displayName: string;
  message: string;
  timestamp: number;
  color?: string;
  channel: string;
}

interface Command {
  trigger: string;
  response: string;
  enabled: boolean;
  cooldown?: number;
}

interface BotConnectionConfig {
  channel: string;
  accessToken: string;
  username: string;
  profileId: string;
  onMessage?: (message: ChatMessage) => void;
  onCommand?: (message: ChatMessage, command: Command) => void;
  getCommands: () => Promise<Command[]>;
}

interface BotConnection {
  ws: WebSocket | null;
  config: BotConnectionConfig;
  reconnectAttempts: number;
  reconnectTimeout: ReturnType<typeof setTimeout> | null;
  pingInterval: ReturnType<typeof setInterval> | null;
  isConnected: boolean;
  lastCommandUse: Map<string, number>;
}

// Store active connections by profileId
const connections = new Map<string, BotConnection>();

// Regex patterns
const PRIVMSG_REGEX = /^(?:@([^ ]+) )?:([^!]+)![^ ]+ PRIVMSG #([^ ]+) :(.+)$/;
const JOIN_REGEX = /:([^!]+)![^@]+@[^ ]+ JOIN #(\S+)/;
const WELCOME_REGEX = /:tmi\.twitch\.tv 001 (\S+) :Welcome/;

function log(profileId: string, ...args: unknown[]): void {
  console.log(`[TwitchBot:${profileId}]`, ...args);
}

function parseTags(tagsStr: string | undefined): Record<string, string> {
  const tags: Record<string, string> = {};
  if (!tagsStr) {
    return tags;
  }

  for (const tag of tagsStr.split(";")) {
    const [key, value] = tag.split("=");
    if (key) {
      tags[key] = value ?? "";
    }
  }
  return tags;
}

function parseMessage(line: string, channel: string): ChatMessage | null {
  const match = line.match(PRIVMSG_REGEX);
  if (!match) {
    return null;
  }

  const [, tagsStr, msgUsername, msgChannel, msgText] = match;
  if (!msgChannel) {
    return null;
  }
  if (!msgUsername) {
    return null;
  }
  if (!msgText) {
    return null;
  }

  if (msgChannel.toLowerCase() !== channel.toLowerCase()) {
    return null;
  }

  const tags = parseTags(tagsStr);
  return {
    id: tags.id ?? `${Date.now()}-${Math.random()}`,
    username: msgUsername.toLowerCase(),
    displayName: tags["display-name"] ?? msgUsername,
    message: msgText,
    timestamp: Number.parseInt(
      tags["tmi-sent-ts"] ?? Date.now().toString(),
      10
    ),
    color: tags.color ?? undefined,
    channel: msgChannel.toLowerCase(),
  };
}

function isCommand(message: string): string | null {
  if (message.startsWith("!")) {
    const parts = message.split(" ");
    return parts[0]?.toLowerCase() ?? null;
  }
  return null;
}

function checkCooldown(
  connection: BotConnection,
  trigger: string,
  cooldown: number | undefined
): boolean {
  if (!cooldown) {
    return true;
  }

  const lastUse = connection.lastCommandUse.get(trigger);
  const now = Date.now();

  if (lastUse && now - lastUse < cooldown * MS_PER_SECOND) {
    return false;
  }

  connection.lastCommandUse.set(trigger, now);
  return true;
}

async function handleMessage(
  connection: BotConnection,
  message: ChatMessage
): Promise<void> {
  const { config, ws } = connection;

  const trigger = isCommand(message.message);
  if (!trigger) {
    config.onMessage?.(message);
    return;
  }

  const commands = await config.getCommands();
  const command = commands.find(
    (cmd) => cmd.trigger === trigger && cmd.enabled
  );

  if (!command) {
    config.onMessage?.(message);
    return;
  }

  if (!checkCooldown(connection, trigger, command.cooldown)) {
    log(config.profileId, `Command ${trigger} on cooldown`);
    return;
  }

  config.onCommand?.(message, command);

  if (ws && ws.readyState === WebSocket.OPEN) {
    const response = command.response
      .replace("{user}", message.displayName)
      .replace("{channel}", message.channel);

    ws.send(`PRIVMSG #${config.channel} :${response}`);
    log(config.profileId, `Sent command response: ${response}`);
  }
}

function processLine(connection: BotConnection, line: string): void {
  const { config, ws } = connection;

  if (line.startsWith("PING")) {
    ws?.send("PONG :tmi.twitch.tv");
    return;
  }

  if (line.includes("PONG")) {
    return;
  }

  const welcomeMatch = line.match(WELCOME_REGEX);
  if (welcomeMatch) {
    log(config.profileId, "Auth successful");
    return;
  }

  const joinMatch = line.match(JOIN_REGEX);
  if (joinMatch) {
    const [, joinUser, joinChannel] = joinMatch;
    if (
      joinUser &&
      joinChannel &&
      joinUser.toLowerCase() === config.username.toLowerCase() &&
      joinChannel.toLowerCase() === config.channel.toLowerCase()
    ) {
      log(config.profileId, `Joined channel #${config.channel}`);
      connection.isConnected = true;
    }
    return;
  }

  const message = parseMessage(line, config.channel);
  if (message) {
    handleMessage(connection, message);
  }
}

function connect(connection: BotConnection): void {
  const { config } = connection;

  log(config.profileId, `Connecting to #${config.channel}...`);

  const ws = new WebSocket(TWITCH_IRC_URL);
  connection.ws = ws;

  ws.onopen = () => {
    log(config.profileId, "WebSocket opened, authenticating...");
    connection.reconnectAttempts = 0;

    ws.send(`PASS oauth:${config.accessToken}`);
    ws.send(`NICK ${config.username.toLowerCase()}`);
    ws.send("CAP REQ :twitch.tv/membership twitch.tv/tags twitch.tv/commands");

    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(`JOIN #${config.channel.toLowerCase()}`);
      }
    }, AUTH_DELAY_MS);

    connection.pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send("PING :keepalive");
      }
    }, PING_INTERVAL_MS);
  };

  ws.onmessage = (event) => {
    const lines = event.data
      .split("\r\n")
      .filter((line: string) => line.trim());
    for (const line of lines) {
      processLine(connection, line);
    }
  };

  ws.onerror = (event) => {
    log(config.profileId, "WebSocket error:", event);
  };

  ws.onclose = (event) => {
    log(config.profileId, "WebSocket closed:", event.code, event.reason);
    connection.isConnected = false;

    if (connection.pingInterval) {
      clearInterval(connection.pingInterval);
      connection.pingInterval = null;
    }

    if (connections.has(config.profileId)) {
      scheduleReconnect(connection);
    }
  };
}

function scheduleReconnect(connection: BotConnection): void {
  const { config } = connection;

  if (connection.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    log(config.profileId, "Max reconnect attempts reached, stopping bot");
    stopBot(config.profileId);
    return;
  }

  connection.reconnectAttempts += 1;
  const delay = Math.min(
    RECONNECT_BASE_DELAY_MS * 2 ** (connection.reconnectAttempts - 1),
    RECONNECT_MAX_DELAY_MS
  );

  log(
    config.profileId,
    `Reconnecting in ${delay}ms (attempt ${connection.reconnectAttempts})...`
  );

  connection.reconnectTimeout = setTimeout(() => {
    if (connections.has(config.profileId)) {
      connect(connection);
    }
  }, delay);
}

export function startBot(config: BotConnectionConfig): boolean {
  const { profileId } = config;

  if (connections.has(profileId)) {
    stopBot(profileId);
  }

  const connection: BotConnection = {
    ws: null,
    config,
    reconnectAttempts: 0,
    reconnectTimeout: null,
    pingInterval: null,
    isConnected: false,
    lastCommandUse: new Map(),
  };

  connections.set(profileId, connection);
  connect(connection);

  log(profileId, "Bot started");
  return true;
}

export function stopBot(profileId: string): boolean {
  const connection = connections.get(profileId);
  if (!connection) {
    return false;
  }

  log(profileId, "Stopping bot...");

  if (connection.reconnectTimeout) {
    clearTimeout(connection.reconnectTimeout);
  }
  if (connection.pingInterval) {
    clearInterval(connection.pingInterval);
  }

  if (connection.ws) {
    connection.ws.onclose = null;
    connection.ws.close();
  }

  connections.delete(profileId);
  log(profileId, "Bot stopped");
  return true;
}

export function getBotStatus(profileId: string): {
  isRunning: boolean;
  isConnected: boolean;
  channel: string | null;
} {
  const connection = connections.get(profileId);
  if (!connection) {
    return { isRunning: false, isConnected: false, channel: null };
  }

  return {
    isRunning: true,
    isConnected: connection.isConnected,
    channel: connection.config.channel,
  };
}

export function getAllBots(): Array<{
  profileId: string;
  channel: string;
  isConnected: boolean;
}> {
  return Array.from(connections.entries()).map(([profileId, connection]) => ({
    profileId,
    channel: connection.config.channel,
    isConnected: connection.isConnected,
  }));
}

export function sendMessage(profileId: string, message: string): boolean {
  const connection = connections.get(profileId);
  if (!connection?.ws || connection.ws.readyState !== WebSocket.OPEN) {
    return false;
  }

  connection.ws.send(`PRIVMSG #${connection.config.channel} :${message}`);
  return true;
}

export type { ChatMessage, Command, BotConnectionConfig };
