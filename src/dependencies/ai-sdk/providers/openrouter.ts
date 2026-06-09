import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { config } from "../../../config";

export const openrouterAiSdkProvider = createOpenRouter({
  apiKey: config.openRouterApiKey,
});
