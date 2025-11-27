import { ChatCircle, Image, Sparkle } from "@phosphor-icons/react";

export const overlayTypes = [
  {
    to: "/overlays/chat" as const,
    title: "Chat",
    label: "Chat",
    description: "Display live chat messages on your stream",
    icon: ChatCircle,
    gradient: "from-blue-500/10 to-cyan-500/10",
    hoverGradient: "group-hover:from-blue-500/20 group-hover:to-cyan-500/20",
    iconColor: "text-blue-500",
    menuClassName: "text-blue-500 hover:bg-blue-500/10",
  },
  {
    to: "/overlays/wall-emote" as const,
    title: "Wall Emote",
    label: "Wall Emote",
    description: "Show a dynamic wall of emotes and reactions",
    icon: Sparkle,
    gradient: "from-orange-500/10 to-red-500/10",
    hoverGradient: "group-hover:from-orange-500/20 group-hover:to-red-500/20",
    iconColor: "text-orange-500",
    menuClassName: "text-orange-500 hover:bg-orange-500/10",
  },
  {
    to: "/overlays/ad" as const,
    title: "Ad Banner",
    label: "Ad",
    description: "Display sponsor logos and promotional content",
    icon: Image,
    gradient: "from-purple-500/10 to-pink-500/10",
    hoverGradient: "group-hover:from-purple-500/20 group-hover:to-pink-500/20",
    iconColor: "text-purple-500",
    menuClassName: "text-purple-500 hover:bg-purple-500/10",
  },
];
