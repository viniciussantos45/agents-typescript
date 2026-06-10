import { personalAssistantAgentDefinition } from "./src/core/agents";

const framework =
  process.argv[2] ?? process.env.AGENT_FRAMEWORK ?? "ai-sdk";

if (framework !== "ai-sdk" && framework !== "langchain") {
  console.error(`Unknown framework "${framework}". Use: ai-sdk | langchain`);
  process.exit(1);
}

const { runAgent } =
  framework === "langchain"
    ? await import("./src/frameworks/langchain")
    : await import("./src/frameworks/ai-sdk");

console.log(`Running personal assistant with the ${framework} strategy…\n`);

const text = await runAgent(
  personalAssistantAgentDefinition,
  "Check what are my long term goals for this year in my vault",
);

console.log(text);
