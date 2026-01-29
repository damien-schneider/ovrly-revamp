import { z } from "zod";

export const modifyOverlayTool = {
  description:
    "Modify an existing overlay element. Use when user asks to update/change existing elements. Always include a changeDescription.",
  parameters: z.object({
    overlayId: z.string(),
    changes: z.record(z.any()),
    changeDescription: z.string(),
  }),
};
