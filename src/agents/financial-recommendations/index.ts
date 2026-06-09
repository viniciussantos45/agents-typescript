import { ToolLoopAgent } from "ai";
import { openrouterAiSdkProvider } from "../../dependencies/ai-sdk/providers";
import { sumListOfNumbersTool, sumTwoNumbersTool } from "../../tools";

export const financialAgent = new ToolLoopAgent({
  model: openrouterAiSdkProvider.chat("deepseek/deepseek-v4-flash"),
  instructions:
    "An agent that help with expenses and financial recommendations. Use the provided tools to answer the user's questions about their expenses and provide financial recommendations based on their spending habits.",
  tools: { sumTwoNumbersTool, sumListOfNumbersTool },
});
