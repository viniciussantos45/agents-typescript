import { expect, test } from "bun:test";
import { sumListOfNumbersTool, sumTwoNumbersTool } from "../../core/tools";
import { toLangchainTool } from "./tool";

test("toLangchainTool maps name, description and schema", () => {
  const adapted = toLangchainTool(sumTwoNumbersTool);
  expect(adapted.name).toBe("sumTwoNumbersTool");
  expect(adapted.description).toBe(sumTwoNumbersTool.description);
  expect(adapted.schema as unknown).toBe(sumTwoNumbersTool.inputSchema);
});

test("adapted tool executes the core implementation", async () => {
  const adapted = toLangchainTool(sumTwoNumbersTool);
  const result = await adapted.invoke({ a: 2, b: 3 });
  expect(result).toBe(5);
});

test("adapted list tool executes the core implementation", async () => {
  const adapted = toLangchainTool(sumListOfNumbersTool);
  const result = await adapted.invoke({ numbers: [1, 2, 3, 4] });
  expect(result).toBe(10);
});
