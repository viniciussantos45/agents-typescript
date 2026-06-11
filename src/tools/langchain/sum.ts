import { tool } from "langchain";
import { z } from "zod";

const sumTwoNumbersTool = tool(
  async ({ a, b }) => {
    console.log(`Summing ${a} and ${b}`);
    return a + b;
  },
  {
    name: "Sum Two Numbers",
    description: "A tool that sums two numbers.",
    schema: z.object({
      a: z.number().describe("The first number to sum."),
      b: z.number().describe("The second number to sum."),
    }),
  },
);

const sumListOfNumbersTool = tool(
  async ({ numbers }) => {
    console.log(`Summing the list of numbers: ${numbers.join(", ")}`);
    return numbers.reduce((acc, num) => acc + num, 0);
  },
  {
    name: "Sum a list of numbers",
    description: "A tool that sums a list of numbers.",
    schema: z.object({
      numbers: z.array(z.number()).describe("The list of numbers to sum."),
    }),
  },
);

export const sumTools = [sumTwoNumbersTool, sumListOfNumbersTool];
