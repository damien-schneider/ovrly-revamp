import { z } from "zod";

export const createOverlayTool = {
  description:
    "Create a new overlay element. Use when user asks to add/create new UI elements.",
  parameters: z.object({
    type: z.enum([
      "OVERLAY",
      "TEXT",
      "BOX",
      "IMAGE",
      "CHAT",
      "EMOTE_WALL",
      "WEBCAM",
      "TIMER",
      "PROGRESS",
    ]),
    name: z.string(),
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    properties: z.record(z.any()),
    parentId: z.string().optional(),
  }),
};
