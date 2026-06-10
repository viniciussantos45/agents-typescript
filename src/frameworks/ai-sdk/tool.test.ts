import { expect, test } from "bun:test";
import { sumListOfNumbersTool, sumTwoNumbersTool } from "../../core/tools";
import { toAiSdkTool } from "./tool";

test("toAiSdkTool maps description and schemas", () => {
  const adapted = toAiSdkTool(sumTwoNumbersTool);
  expect(adapted.description).toBe(sumTwoNumbersTool.description);
  expect(adapted.inputSchema).toBe(sumTwoNumbersTool.inputSchema);
  expect(adapted.outputSchema).toBe(sumTwoNumbersTool.outputSchema);
});

test("adapted tool executes the core implementation", async () => {
  const adapted = toAiSdkTool(sumTwoNumbersTool);
  const result = await adapted.execute!(
    { a: 2, b: 3 },
    { toolCallId: "test", messages: [] },
  );
  expect(result).toBe(5);
});

test("adapted list tool executes the core implementation", async () => {
  const adapted = toAiSdkTool(sumListOfNumbersTool);
  const result = await adapted.execute!(
    { numbers: [1, 2, 3, 4] },
    { toolCallId: "test", messages: [] },
  );
  expect(result).toBe(10);
});
