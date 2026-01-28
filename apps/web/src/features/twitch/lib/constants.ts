// Constants for Twitch chat connection
export const MAX_MESSAGES_IN_MEMORY = 100;
export const AUTH_DELAY_MS = 100;
export const CONNECTION_TIMEOUT_MS = 10_000;
export const BASE_RECONNECT_DELAY_MS = 1000;
export const MAX_RECONNECT_DELAY_MS = 30_000;
export const MAX_RECONNECT_ATTEMPTS = 5;
export const INITIAL_CONNECTION_DELAY_MS = 500;
export const TWITCH_IRC_URL = "wss://irc-ws.chat.twitch.tv:443";

// Debug mode - set to true to enable console logging
export const DEBUG_MODE = true;

// Regex patterns at module level for performance
export const CHANNEL_PREFIX_REGEX = /^#/;
export const PRIVMSG_REGEX =
  /^(?:@([^ ]+) )?:([^!]+)![^ ]+ PRIVMSG #([^ ]+) :(.+)$/;
export const NOTICE_REGEX = /NOTICE \* :(.+)$/;
// Match JOIN messages: ":username!username@username.tmi.twitch.tv JOIN #channel"
export const JOIN_REGEX = /:([^!]+)![^@]+@[^ ]+ JOIN #(\S+)/;
// Match welcome messages (001) which confirm successful auth
export const WELCOME_REGEX = /:tmi\.twitch\.tv 001 (\S+) :Welcome/;
