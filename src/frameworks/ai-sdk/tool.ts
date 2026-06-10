import { tool, type Tool } from "ai";
import type { AnyToolDefinition } from "../../core/tools";

export function toAiSdkTool(definition: AnyToolDefinition): Tool {
  return tool({
    description: definition.description,
    inputSchema: definition.inputSchema,
    ...(definition.outputSchema
      ? { outputSchema: definition.outputSchema }
      : {}),
    execute: async (input, { abortSignal }) =>
      definition.execute(input, { abortSignal }),
  });
}
