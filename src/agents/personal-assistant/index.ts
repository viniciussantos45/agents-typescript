import { tool, ToolLoopAgent } from "ai";
import { z } from "zod";
import { openrouterAiSdkProvider } from "../../dependencies/ai-sdk/providers";
import { financialAgent } from "../financial-recommendations";

const financialSubAgent = tool({
  description:
    "A sub-agent that provides financial recommendations based on the user's spending habits.",
  inputSchema: z.object({
    prompt: z
      .string()
      .describe("The user's question or request related to their finances."),
  }),
  execute: async ({ prompt }, { abortSignal }) => {
    const result = await financialAgent.generate({ prompt, abortSignal });
    return result.text;
  },
});

export const personalAssistantAgent = new ToolLoopAgent({
  model: openrouterAiSdkProvider.chat("deepseek/deepseek-v4-flash"),
  instructions:
    "An agent that helps with various personal tasks, such as managing expenses, providing financial recommendations, setting reminders, and answering general questions. Use the provided tools to assist the user with their needs and provide helpful information based on their requests.",
  tools: { financialSubAgent },
});
