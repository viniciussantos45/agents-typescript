import { tool, ToolLoopAgent, type ToolSet } from "ai";
import { z } from "zod";
import type { AgentDefinition, SubAgentRef } from "../../core/agents";
import { resolveModel } from "./providers";
import { toAiSdkTool } from "./tool";

type AiSdkAgent = ToolLoopAgent<never, ToolSet>;

function toSubAgentTool(ref: SubAgentRef) {
  const subAgent = createAiSdkAgent(ref.agent);
  return tool({
    ...(ref.toolTitle ? { title: ref.toolTitle } : {}),
    description: ref.toolDescription,
    inputSchema: z.object({
      prompt: z.string().describe(ref.promptDescription),
    }),
    execute: async ({ prompt }, { abortSignal }) => {
      const result = await subAgent.generate({ prompt, abortSignal });
      if (result.text.trim()) return result.text;
      // Small models often produce no text after a tool call; surface the raw tool output instead
      const lastOutput = result.toolResults
        .map((r) =>
          typeof r.output === "string" ? r.output : JSON.stringify(r.output),
        )
        .filter(Boolean)
        .at(-1);
      return lastOutput ?? `${ref.toolName} completed with no output.`;
    },
  });
}

export function createAiSdkAgent(definition: AgentDefinition): AiSdkAgent {
  const tools: ToolSet = {};
  for (const toolDefinition of definition.tools) {
    tools[toolDefinition.name] = toAiSdkTool(toolDefinition);
  }
  for (const subAgentRef of definition.subagents ?? []) {
    tools[subAgentRef.toolName] = toSubAgentTool(subAgentRef);
  }

  return new ToolLoopAgent({
    model: resolveModel(definition.model),
    ...(definition.model.options?.think
      ? { providerOptions: { ollama: { think: true } } }
      : {}),
    instructions: definition.instructions,
    tools,
  });
}

export async function runAgent(
  definition: AgentDefinition,
  prompt: string,
): Promise<string> {
  const agent = createAiSdkAgent(definition);
  const result = await agent.generate({ prompt });
  return result.text;
}
