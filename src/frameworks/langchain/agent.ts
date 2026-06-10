import { HumanMessage, type BaseMessage } from "@langchain/core/messages";
import { createAgent, tool } from "langchain";
import { z } from "zod";
import type { AgentDefinition, SubAgentRef } from "../../core/agents";
import { resolveChatModel } from "./providers";
import { toLangchainTool } from "./tool";

type LangchainAgent = ReturnType<typeof createAgent>;

function messageText(message: BaseMessage | undefined): string {
  if (!message) return "";
  const content = message.content;
  if (typeof content === "string") return content;
  return content
    .map((block) =>
      typeof block === "string"
        ? block
        : "text" in block
          ? String(block.text)
          : "",
    )
    .join("");
}

function finalText(result: { messages: BaseMessage[] }): string {
  const text = messageText(result.messages.at(-1)).trim();
  if (text) return text;
  // Small models often produce no text after a tool call; surface the raw tool output instead
  const lastToolOutput = result.messages
    .filter((message) => message.getType() === "tool")
    .map((message) => messageText(message))
    .filter(Boolean)
    .at(-1);
  return lastToolOutput ?? "";
}

function toSubAgentTool(ref: SubAgentRef) {
  const subAgent = createLangchainAgent(ref.agent);
  return tool(
    async ({ prompt }: { prompt: string }, config) => {
      const result = await subAgent.invoke(
        { messages: [new HumanMessage(prompt)] },
        { signal: config?.signal },
      );
      return finalText(result) || `${ref.toolName} completed with no output.`;
    },
    {
      name: ref.toolName,
      description: ref.toolDescription,
      schema: z.object({
        prompt: z.string().describe(ref.promptDescription),
      }),
    },
  );
}

export function createLangchainAgent(
  definition: AgentDefinition,
): LangchainAgent {
  const tools = [
    ...definition.tools.map(toLangchainTool),
    ...(definition.subagents ?? []).map(toSubAgentTool),
  ];

  return createAgent({
    model: resolveChatModel(definition.model),
    tools,
    systemPrompt: definition.instructions,
  });
}

export async function runAgent(
  definition: AgentDefinition,
  prompt: string,
): Promise<string> {
  const agent = createLangchainAgent(definition);
  const result = await agent.invoke({
    messages: [new HumanMessage(prompt)],
  });
  return finalText(result);
}
