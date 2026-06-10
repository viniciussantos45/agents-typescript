import { tool, ToolLoopAgent } from "ai";
import { z } from "zod";
import { ollamaAiSdkProvider } from "../../dependencies/ai-sdk/providers";
import { financialAgent } from "../financial-recommendations";
import { humanInTheLoopAgent } from "../human-in-the-loop";
import { obsidianOrchestratorAgent } from "../obsidian-orchestrator";

const financialSubAgent = tool({
  description:
    "Handles expense arithmetic and financial calculations — totaling expenses, comparing amounts, computing sums and differences across a list of values. Use for any request that involves adding, summing, or tallying numbers in a financial context.",
  inputSchema: z.object({
    prompt: z
      .string()
      .describe(
        "The calculation request, including the numbers and what should be computed.",
      ),
  }),
  execute: async ({ prompt }, { abortSignal }) => {
    const result = await financialAgent.generate({ prompt, abortSignal });
    if (result.text.trim()) return result.text;
    const lastOutput = result.toolResults
      .map((r) =>
        typeof r.output === "string" ? r.output : JSON.stringify(r.output),
      )
      .filter(Boolean)
      .at(-1);
    return lastOutput ?? "Calculation completed with no output.";
  },
});

const humanInTheLoopSubAgent = tool({
  title: "Human input and approval",
  description:
    "Pauses execution to collect input, approval, a decision, or feedback from the user. Use when the task is ambiguous and needs clarification, when an irreversible action requires confirmation, when the user must choose between options before work can continue, or when AI-generated content should be reviewed before being applied.",
  inputSchema: z.object({
    prompt: z
      .string()
      .describe(
        "What you need from the user — be specific: clarification, approval, a choice, or a review of content.",
      ),
  }),
  execute: async ({ prompt }, { abortSignal }) => {
    const result = await humanInTheLoopAgent.generate({ prompt, abortSignal });
    if (result.text.trim()) return result.text;
    // Small models often produce no text after a tool call; surface the raw tool output instead
    const lastOutput = result.toolResults
      .map((r) =>
        typeof r.output === "string" ? r.output : JSON.stringify(r.output),
      )
      .filter(Boolean)
      .at(-1);
    return lastOutput ?? "Human interaction completed with no output.";
  },
});

const obsidianSubAgent = tool({
  description:
    "Manages the user's Obsidian vault: reading, creating, editing, moving, and deleting notes; searching vault content; handling daily notes and tasks; managing tags, properties, links, bookmarks, and templates; and controlling plugins, themes, and sync. Use for any request that involves reading or writing content in Obsidian.",
  inputSchema: z.object({
    prompt: z
      .string()
      .describe(
        "The Obsidian request, including which note, folder, or vault to target and what action to perform.",
      ),
  }),
  execute: async ({ prompt }, { abortSignal }) => {
    const result = await obsidianOrchestratorAgent.generate({
      prompt,
      abortSignal,
    });
    if (result.text.trim()) return result.text;
    const lastOutput = result.toolResults
      .map((r) =>
        typeof r.output === "string" ? r.output : JSON.stringify(r.output),
      )
      .filter(Boolean)
      .at(-1);
    return lastOutput ?? "Obsidian operation completed with no output.";
  },
});

export const personalAssistantAgent = new ToolLoopAgent({
  model: ollamaAiSdkProvider.chat("qwen3.5:2b"),
  providerOptions: {
    ollama: {
      think: true,
    },
  },
  instructions: `You are a personal assistant that routes requests to the right specialist sub-agent. Never answer from general knowledge when a sub-agent can handle the task.

Routing rules:
- financialSubAgent — expense totals, budget arithmetic, or any calculation involving financial numbers provided by the user.
- obsidianSubAgent — any interaction with the user's Obsidian vault: reading or writing notes, daily notes, tasks, search, tags, file management.
- humanInTheLoopSubAgent — when the request is ambiguous and you need clarification before routing, when an action needs explicit user approval, or when the user must choose between options.

Execution rules:
- After every tool result, immediately evaluate whether the original user goal is fully accomplished. If not, call the next required tool right away.
- Never generate a final text response mid-task. A text response is only appropriate when the complete user request has been satisfied and you have the result to present.
- If humanInTheLoopSubAgent returns a clarification (e.g. a corrected name, a confirmed choice), use that answer immediately to continue the task — do not stop to report that you asked.`,
  tools: { financialSubAgent, humanInTheLoopSubAgent, obsidianSubAgent },
});
