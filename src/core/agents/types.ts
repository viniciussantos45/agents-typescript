import type { AnyToolDefinition } from "../tools/types";

/**
 * Framework-agnostic reference to a model. Each framework adapter resolves
 * this to its own provider/model instance.
 */
export interface ModelRef {
  provider: "ollama" | "openrouter";
  model: string;
  options?: {
    /** Enable extended thinking on providers that support it (e.g. Ollama). */
    think?: boolean;
  };
}

/**
 * A sub-agent exposed to its parent as a single-prompt tool. The adapter
 * builds the sub-agent recursively and wraps its invocation in a tool using
 * these descriptions.
 */
export interface SubAgentRef {
  agent: AgentDefinition;
  toolName: string;
  toolTitle?: string;
  toolDescription: string;
  /** Description of the `prompt` input parameter shown to the model. */
  promptDescription: string;
}

export interface AgentDefinition {
  name: string;
  model: ModelRef;
  instructions: string;
  tools: AnyToolDefinition[];
  subagents?: SubAgentRef[];
}
