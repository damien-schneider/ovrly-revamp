export interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: number;
  displayName?: string;
  color?: string;
}

export interface UseTwitchChatOptions {
  channel: string | null | undefined;
  accessToken: string | null | undefined;
  username: string | null | undefined;
  enabled?: boolean;
  onMessage?: (message: ChatMessage) => void;
}

export interface UseTwitchChatReturn {
  messages: ChatMessage[];
  isConnected: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  clearMessages: () => void;
  sendMessage: (message: string) => void;
}

export interface MessageProcessorContext {
  ws: WebSocket;
  normalizedChannel: string;
  username: string;
  clearConnectionTimeout: () => void;
  setError: (error: string | null) => void;
  setIsConnected: (connected: boolean) => void;
  isConnectingRef: React.RefObject<boolean>;
  addMessage: (message: ChatMessage) => void;
}
