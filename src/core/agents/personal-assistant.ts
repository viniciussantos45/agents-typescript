import { financialAgentDefinition } from "./financial";
import { humanInTheLoopAgentDefinition } from "./human-in-the-loop";
import { obsidianOrchestratorAgentDefinition } from "./obsidian-orchestrator";
import type { AgentDefinition } from "./types";

export const personalAssistantAgentDefinition: AgentDefinition = {
  name: "personalAssistantAgent",
  model: { provider: "ollama", model: "qwen3.5:2b", options: { think: true } },
  instructions: `You are a personal assistant that routes requests to the right specialist sub-agent. Never answer from general knowledge when a sub-agent can handle the task.

Routing rules:
- financialSubAgent — expense totals, budget arithmetic, or any calculation involving financial numbers provided by the user.
- obsidianSubAgent — any interaction with the user's Obsidian vault: reading or writing notes, daily notes, tasks, search, tags, file management.
- humanInTheLoopSubAgent — when the request is ambiguous and you need clarification before routing, when an action needs explicit user approval, or when the user must choose between options.

Execution rules:
- After every tool result, immediately evaluate whether the original user goal is fully accomplished. If not, call the next required tool right away.
- Never generate a final text response mid-task. A text response is only appropriate when the complete user request has been satisfied and you have the result to present.
- If humanInTheLoopSubAgent returns a clarification (e.g. a corrected name, a confirmed choice), use that answer immediately to continue the task — do not stop to report that you asked.`,
  tools: [],
  subagents: [
    {
      agent: financialAgentDefinition,
      toolName: "financialSubAgent",
      toolDescription:
        "Handles expense arithmetic and financial calculations — totaling expenses, comparing amounts, computing sums and differences across a list of values. Use for any request that involves adding, summing, or tallying numbers in a financial context.",
      promptDescription:
        "The calculation request, including the numbers and what should be computed.",
    },
    {
      agent: humanInTheLoopAgentDefinition,
      toolName: "humanInTheLoopSubAgent",
      toolTitle: "Human input and approval",
      toolDescription:
        "Pauses execution to collect input, approval, a decision, or feedback from the user. Use when the task is ambiguous and needs clarification, when an irreversible action requires confirmation, when the user must choose between options before work can continue, or when AI-generated content should be reviewed before being applied.",
      promptDescription:
        "What you need from the user — be specific: clarification, approval, a choice, or a review of content.",
    },
    {
      agent: obsidianOrchestratorAgentDefinition,
      toolName: "obsidianSubAgent",
      toolDescription:
        "Manages the user's Obsidian vault: reading, creating, editing, moving, and deleting notes; searching vault content; handling daily notes and tasks; managing tags, properties, links, bookmarks, and templates; and controlling plugins, themes, and sync. Use for any request that involves reading or writing content in Obsidian.",
      promptDescription:
        "The Obsidian request, including which note, folder, or vault to target and what action to perform.",
    },
  ],
};
