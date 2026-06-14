import { ChatOllama } from "@langchain/ollama";
import { createAgent, tool } from "langchain";
import { z } from "zod";
import { financialCoachAgent } from "./financial-coach";
import { humanInTheLoopAgent } from "./human-in-the-loop";
import { obsidianOrchestratorAgent } from "./obsidian-orchestrator";

const model = new ChatOllama({
  model: "gemma4:12b-mlx",
});

const financialCoachSubAgent = tool(
  async ({ query }) => {
    const result = await financialCoachAgent.invoke({
      messages: [{ role: "user", content: query }],
    });
    return result.messages.at(-1)?.content;
  },
  {
    name: "financial_coach",
    description: "Financial questions and sums values",
    schema: z.object({ query: z.string() }),
  },
);

const humanInTheLoopSubAgent = tool(
  async ({ query }) => {
    const result = await humanInTheLoopAgent.invoke({
      messages: [{ role: "user", content: query }],
    });
    return result.messages.at(-1)?.content;
  },
  {
    name: "human_in_the_loop_subagent",
    description: "Ask questions to user",
    schema: z.object({ query: z.string() }),
  },
);

const obsidianSubAgent = tool(
  async ({ query }) => {
    const result = await obsidianOrchestratorAgent.invoke({
      messages: [{ role: "user", content: query }],
    });
    return result.messages.at(-1)?.content;
  },
  {
    name: "obsidian_subagent",
    description: "Manage obsidian vaults",
    schema: z.object({ query: z.string() }),
  },
);

// const checkpointer = new MemorySaver();

export const personalAssistantAgent = createAgent({
  model,
  // providerOptions: {
  //   ollama: {
  //     think: true,
  //   },
  // },
  systemPrompt: `You are a personal assistant that routes requests to the right specialist sub-agent. Never answer from general knowledge when a sub-agent can handle the task.

Routing rules:
- financialSubAgent — expense totals, budget arithmetic, or any calculation involving financial numbers provided by the user.
- obsidianSubAgent — any interaction with the user's Obsidian vault: reading or writing notes, daily notes, tasks, search, tags, file management.
- humanInTheLoopSubAgent — when the request is ambiguous and you need clarification before routing, when an action needs explicit user approval, or when the user must choose between options.

Execution rules:
- After every tool result, immediately evaluate whether the original user goal is fully accomplished. If not, call the next required tool right away.
- Never generate a final text response mid-task. A text response is only appropriate when the complete user request has been satisfied and you have the result to present.
- If humanInTheLoopSubAgent returns a clarification (e.g. a corrected name, a confirmed choice), use that answer immediately to continue the task — do not stop to report that you asked.`,
  // checkpointer,
  tools: [financialCoachSubAgent, humanInTheLoopSubAgent, obsidianSubAgent],
});
