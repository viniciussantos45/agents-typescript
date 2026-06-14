import { personalAssistantAgent } from "./src/implementations/langchain/agents/personal-assistant";

// const result = await personalAssistantAgent.generate({
//   prompt: "Check what are my long term goals for this year in my vault",
// });

async function promptAsync(question: string): Promise<string> {
  process.stdout.write(question);

  for await (const line of console) {
    return line;
  }

  return "";
}

// let message: string;

// do {
//   message = prompt(
//     "Make a question to the agent about your notes in Obsidian. For example, you can ask 'What are the main topics I have notes on?' or 'Summarize my notes from last week:\n",
//   ) as string;
// } while (!message);

const threadConfig = {
  // configurable: { thread_id: "2" },
  recursionLimit: 30,
};
const result = await personalAssistantAgent.invoke(
  {
    messages: [
      {
        role: "user",
        content: await promptAsync(
          "Make a question to the agent about your notes in Obsidian. For example, you can ask 'What are the main topics I have notes on?' or 'Summarize my notes from last week:\n",
        ),
      },
    ],
  },
  threadConfig,
);

console.log(result.messages[result.messages.length - 1]?.content);
