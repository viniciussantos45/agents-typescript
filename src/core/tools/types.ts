import type { z } from "zod";

export interface ToolExecutionContext {
  abortSignal?: AbortSignal;
}

/**
 * Framework-agnostic tool definition. Carries everything a framework adapter
 * needs to expose the tool to a model: name, description, zod schemas, and the
 * business-logic execute function. Must not import from any agent framework.
 */
export interface ToolDefinition<
  TIn extends z.ZodType = z.ZodType<any>,
  TOut = unknown,
> {
  name: string;
  description: string;
  inputSchema: TIn;
  outputSchema?: z.ZodType<TOut>;
  execute: (
    input: z.output<TIn>,
    ctx?: ToolExecutionContext,
  ) => Promise<TOut> | TOut;
}

export function defineTool<TIn extends z.ZodType<any>, TOut>(
  definition: ToolDefinition<TIn, TOut>,
): ToolDefinition<TIn, TOut> {
  return definition;
}

export type AnyToolDefinition = ToolDefinition<z.ZodType<any>, any>;
