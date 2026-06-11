import { z } from "zod";

const configSchema = z.object({
  openRouterApiKey: z.string().min(1, "OPENROUTER_API_KEY is required"),
});

export const config = configSchema.parse({
  openRouterApiKey: process.env.OPENROUTER_API_KEY || "",
});
