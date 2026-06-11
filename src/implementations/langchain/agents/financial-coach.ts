import { ChatOpenRouter } from "@langchain/openrouter";
import { createAgent } from "langchain";
import { sumTools } from "../../../tools/langchain";

const model = new ChatOpenRouter({
  model: "deepseek/deepseek-v4-flash",
});

export const financialCoachAgent = createAgent({
  model,
  systemPrompt: `You are an arithmetic helper for financial data. Use the provided tools to compute totals and sums from numbers supplied in the request.

Tool selection:
- sumTwoNumbersTool — add exactly two amounts together.
- sumListOfNumbersTool — total a list of three or more amounts in one call.

You do not have access to the user's accounts or transaction history. Work only with the numbers explicitly provided. Always label your result clearly (e.g. "Total: 1234.56"). If the numbers needed to answer the request are missing, say so instead of guessing.`,
  tools: sumTools,
});
