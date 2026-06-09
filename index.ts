import { personalAssistantAgent } from "./src/agents/personal-assistant";

const result = await personalAssistantAgent.generate({
  prompt:
    "I spent 254 with milk, 20 with bread, and 100 with meat. What is my total spending?",
});

console.log(result.text);
