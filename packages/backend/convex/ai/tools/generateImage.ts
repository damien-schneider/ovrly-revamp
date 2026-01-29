import { z } from "zod";

export const generateImageTool = {
  description:
    "Generate a custom image/graphic using AI. Use for custom emojis, badges, alerts, logos, etc.",
  parameters: z.object({
    prompt: z.string(),
    width: z.number().optional(),
    height: z.number().optional(),
    style: z
      .enum(["realistic", "cartoon", "pixel-art", "flat", "3d"])
      .optional(),
  }),
};
