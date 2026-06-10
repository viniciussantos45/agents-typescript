import { tool } from "langchain";
import type { AnyToolDefinition } from "../../core/tools";

export function toLangchainTool(definition: AnyToolDefinition) {
  return tool(
    async (input, config) =>
      definition.execute(input as never, { abortSignal: config?.signal }),
    {
      name: definition.name,
      description: definition.description,
      schema: definition.inputSchema,
    },
  );
}
