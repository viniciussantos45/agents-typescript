import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createOllama } from "ollama-ai-provider-v2";
import type { ModelRef } from "../../core/agents";
import { config } from "../../core/config";

export const ollamaAiSdkProvider = createOllama();

export const openrouterAiSdkProvider = createOpenRouter({
  apiKey: config.openRouterApiKey,
});

export function resolveModel(ref: ModelRef) {
  switch (ref.provider) {
    case "ollama":
      return ollamaAiSdkProvider.chat(ref.model);
    case "openrouter":
      return openrouterAiSdkProvider.chat(ref.model);
  }
}
