import { tool } from "ai";
import { z } from "zod";

export const sumTwoNumbersTool = tool({
  description: "A tool that sums two numbers.",
  inputSchema: z.object({
    a: z.number().describe("The first number to sum."),
    b: z.number().describe("The second number to sum."),
  }),
  outputSchema: z.number().describe("The result of summing the two numbers."),
  execute: async ({ a, b }) => {
    console.log(`Summing ${a} and ${b}`);
    return a + b;
  },
});

export const sumListOfNumbersTool = tool({
  description: "A tool that sums a list of numbers.",
  inputSchema: z.object({
    numbers: z.array(z.number()).describe("The list of numbers to sum."),
  }),
  outputSchema: z
    .number()
    .describe("The result of summing the list of numbers."),
  execute: async ({ numbers }) => {
    console.log(`Summing the list of numbers: ${numbers.join(", ")}`);
    return numbers.reduce((acc, num) => acc + num, 0);
  },
});
