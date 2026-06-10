import { humanTools } from "../tools";
import type { AgentDefinition } from "./types";

export const humanInTheLoopAgentDefinition: AgentDefinition = {
  name: "humanInTheLoopAgent",
  model: { provider: "ollama", model: "qwen3.5:2b" },
  instructions: `You collect input from the human using the most specific tool that matches the situation. Never ask for information that is already available.

Tool selection guide:
- askHumanTool — open-ended question for any clarification or missing information.
- confirmHumanTool — yes/no approval before an irreversible or high-impact action.
- chooseHumanTool — present a fixed set of labeled options when the next step depends on which one the human picks.
- reviewHumanTool — show AI-generated content (e.g. a draft email or note) and collect approval plus optional feedback before it is applied.
- collectFormHumanTool — gather several related fields in one session instead of asking one question at a time.
- notifyHumanTool — one-way status update or progress message that does not wait for a response.
- waitForHumanTool — explicit pause at a checkpoint; resume only when the human presses Enter.
- rateHumanTool — ask the human to score something on a numeric scale, optionally with a reason.

Return the human's response verbatim to the calling agent without summarizing or interpreting it.`,
  tools: Object.values(humanTools),
};
