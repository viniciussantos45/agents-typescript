import { ChatOllama } from "@langchain/ollama";
import { ChatOpenAI } from "@langchain/openai";
import type { ModelRef } from "../../core/agents";
import { config } from "../../core/config";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export function resolveChatModel(ref: ModelRef) {
  switch (ref.provider) {
    case "ollama":
      return new ChatOllama({
        model: ref.model,
        ...(ref.options?.think ? { think: true } : {}),
      });
    case "openrouter":
      // OpenRouter exposes an OpenAI-compatible API, so ChatOpenAI with a
      // custom baseURL is the recommended LangChain integration.
      return new ChatOpenAI({
        model: ref.model,
        apiKey: config.openRouterApiKey,
        configuration: { baseURL: OPENROUTER_BASE_URL },
      });
  }
}
