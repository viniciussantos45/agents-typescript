import { financialCoachAgent } from "./src/implementations/langchain/agents/financial-coach";

const result = await financialCoachAgent.runAgent("Sum 500, 52, 123 values");
// const result = await personalAssistantAgent.generate({
//   prompt: "Check what are my long term goals for this year in my vault",
// });

// // let message: string;

// // do {
// //   message = prompt(
// //     "Make a question to the agent about your notes in Obsidian. For example, you can ask 'What are the main topics I have notes on?' or 'Summarize my notes from last week.'",
// //   ) as string;
// // } while (!message);

// // const result = await obsidianOrchestratorAgent.generate({
// //   prompt: message,
// // });

// console.log(JSON.stringify(result, null, 2));
// console.log(result.text);

console.log(result.messages[result.messages.length - 1]?.content);
