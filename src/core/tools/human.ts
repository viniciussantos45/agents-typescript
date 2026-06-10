import { defineTool } from "./types";
import { createInterface } from "readline";
import { z } from "zod";

// ─── Terminal helpers ─────────────────────────────────────────────────────────

const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
} as const;

function print(text: string) {
  process.stdout.write(text);
}

function divider(color: string = C.cyan) {
  print(`${color}${"─".repeat(60)}${C.reset}\n`);
}

function header(label: string, icon: string, color: string) {
  divider(color);
  print(`${color}${C.bold}${icon}  ${label}${C.reset}\n`);
  divider(color);
}

async function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// ─── Tools ───────────────────────────────────────────────────────────────────

/**
 * Ask the human a free-form question and return their answer.
 * Use for clarifications, missing info, or open-ended input.
 */
export const askHumanTool = defineTool({
  name: "askHumanTool",
  description:
    "Pause execution and ask the human a free-form question. Use when you need clarification, missing information, or any open-ended input to proceed. Returns the human's verbatim response.",
  inputSchema: z.object({
    question: z.string().describe("The question to ask the human"),
    context: z
      .string()
      .optional()
      .describe("Why you need this information (shown to the human)"),
  }),
  outputSchema: z.string().describe("The human's response"),
  execute: async ({ question, context }) => {
    print("\n");
    header("Agent needs your input", "❓", C.cyan);
    if (context) {
      print(`${C.dim}Context: ${context}${C.reset}\n\n`);
    }
    print(`${C.bold}${question}${C.reset}\n\n`);
    const answer = await prompt(`${C.cyan}Your answer:${C.reset} `);
    divider(C.cyan);
    print("\n");
    return answer;
  },
});

/**
 * Ask the human to confirm or reject an action.
 * Use before irreversible or high-impact operations.
 */
export const confirmHumanTool = defineTool({
  name: "confirmHumanTool",
  description:
    "Pause and ask the human to approve or reject a specific action before proceeding. Returns whether they confirmed, plus an optional comment. Always use before irreversible or high-impact actions.",
  inputSchema: z.object({
    action: z
      .string()
      .describe("Clear description of the action requiring confirmation"),
    consequence: z
      .string()
      .optional()
      .describe("What will happen if confirmed"),
    defaultConfirm: z
      .boolean()
      .optional()
      .describe("Pre-selected default (shown in prompt)"),
  }),
  outputSchema: z.object({
    confirmed: z.boolean(),
    comment: z.string().optional(),
  }),
  execute: async ({ action, consequence, defaultConfirm = false }) => {
    print("\n");
    header("Confirmation required", "⚠️ ", C.yellow);
    print(`${C.bold}Action:${C.reset} ${action}\n`);
    if (consequence) {
      print(`${C.bold}Consequence:${C.reset} ${consequence}\n`);
    }
    print("\n");

    const hint = defaultConfirm ? "Y/n" : "y/N";
    const raw = await prompt(`${C.yellow}Confirm? (${hint})${C.reset} `);

    const confirmed =
      raw === "" ? defaultConfirm : ["y", "yes"].includes(raw.toLowerCase());

    print(
      confirmed
        ? `${C.green}✓ Confirmed${C.reset}\n`
        : `${C.red}✗ Rejected${C.reset}\n`,
    );

    let comment: string | undefined;
    if (!confirmed) {
      const reason = await prompt(
        `${C.dim}Reason (optional, press Enter to skip):${C.reset} `,
      );
      if (reason) comment = reason;
    }

    divider(C.yellow);
    print("\n");
    return { confirmed, comment };
  },
});

/**
 * Present the human with labeled options and return their selection.
 * Use when the agent must branch on a human decision.
 */
export const chooseHumanTool = defineTool({
  name: "chooseHumanTool",
  description:
    "Present the human with a numbered list of options and return the one they select. Use when the agent must branch based on a human decision and the options are known in advance.",
  inputSchema: z.object({
    question: z.string().describe("The decision or question to present"),
    options: z
      .array(z.string())
      .min(2)
      .max(9)
      .describe("List of choices (2–9 options)"),
    context: z.string().optional().describe("Background info for the human"),
  }),
  outputSchema: z.object({
    choice: z.string().describe("The selected option text"),
    index: z.number().describe("Zero-based index of the selected option"),
  }),
  execute: async ({ question, options, context }) => {
    print("\n");
    header("Choose an option", "🔀", C.magenta);
    if (context) {
      print(`${C.dim}${context}${C.reset}\n\n`);
    }
    print(`${C.bold}${question}${C.reset}\n\n`);
    options.forEach((opt, i) => {
      print(`  ${C.magenta}${C.bold}[${i + 1}]${C.reset} ${opt}\n`);
    });
    print("\n");

    let index = -1;
    while (index < 0 || index >= options.length) {
      const raw = await prompt(
        `${C.magenta}Enter number (1–${options.length}):${C.reset} `,
      );
      const n = parseInt(raw, 10);
      if (!isNaN(n) && n >= 1 && n <= options.length) {
        index = n - 1;
      } else {
        print(
          `${C.red}Invalid choice. Please enter a number between 1 and ${options.length}.${C.reset}\n`,
        );
      }
    }

    print(`${C.green}✓ Selected: ${options[index]}${C.reset}\n`);
    divider(C.magenta);
    print("\n");
    return { choice: options[index], index };
  },
});

/**
 * Show content to the human for review and collect their approval + feedback.
 * Use before publishing, sending, or applying generated content.
 */
export const reviewHumanTool = defineTool({
  name: "reviewHumanTool",
  description:
    "Show content to the human for review and collect their approval plus optional feedback. Use before publishing, sending, or applying AI-generated content. Returns whether they approved and any feedback they provided.",
  inputSchema: z.object({
    title: z.string().describe("What is being reviewed (e.g. 'Email draft')"),
    content: z.string().describe("The content to display for review"),
    instructions: z
      .string()
      .optional()
      .describe("What the human should focus on when reviewing"),
  }),
  outputSchema: z.object({
    approved: z.boolean(),
    feedback: z.string().optional(),
  }),
  execute: async ({ title, content, instructions }) => {
    print("\n");
    header(`Review: ${title}`, "👁 ", C.blue);
    if (instructions) {
      print(`${C.dim}${instructions}${C.reset}\n\n`);
    }
    print(`${content}\n\n`);
    divider(C.blue);

    const raw = await prompt(`${C.blue}Approve? (y/N):${C.reset} `);
    const approved = ["y", "yes"].includes(raw.toLowerCase());

    print(
      approved
        ? `${C.green}✓ Approved${C.reset}\n`
        : `${C.red}✗ Not approved${C.reset}\n`,
    );

    const feedbackRaw = await prompt(
      `${C.dim}Feedback (optional, press Enter to skip):${C.reset} `,
    );
    const feedback = feedbackRaw || undefined;

    divider(C.blue);
    print("\n");
    return { approved, feedback };
  },
});

/**
 * Collect multiple named fields from the human via sequential prompts.
 * Use to gather structured data when schema is not known at compile time.
 */
export const collectFormHumanTool = defineTool({
  name: "collectFormHumanTool",
  description:
    "Ask the human to fill in multiple named fields via sequential prompts and return all answers as a key/value record. Use when you need several related pieces of information at once.",
  inputSchema: z.object({
    title: z
      .string()
      .describe("What is being collected (e.g. 'Event details')"),
    fields: z
      .array(
        z.object({
          name: z.string().describe("Field key used in the returned record"),
          label: z.string().describe("Human-readable prompt label"),
          required: z
            .boolean()
            .optional()
            .describe("Re-prompt if left empty (default: false)"),
          placeholder: z
            .string()
            .optional()
            .describe("Example value shown as a hint"),
        }),
      )
      .min(1)
      .describe("Fields to collect"),
  }),
  outputSchema: z
    .record(z.string(), z.string())
    .describe("Map of field name → answer"),
  execute: async ({ title, fields }) => {
    print("\n");
    header(`Collecting: ${title}`, "📋", C.cyan);
    print(
      `${C.dim}Fill in the following fields. Press Enter to leave optional fields blank.${C.reset}\n\n`,
    );

    const result: Record<string, string> = {};

    for (const field of fields) {
      const hint = field.placeholder
        ? ` ${C.dim}(e.g. ${field.placeholder})${C.reset}`
        : "";
      const req = field.required ? `${C.red}*${C.reset}` : "";

      let value = "";
      while (true) {
        value = await prompt(
          `${C.cyan}${C.bold}${field.label}${C.reset}${req}${hint}: `,
        );
        if (value || !field.required) break;
        print(`${C.red}This field is required.${C.reset}\n`);
      }

      result[field.name] = value;
    }

    divider(C.cyan);
    print("\n");
    return result;
  },
});

/**
 * Send a one-way notification to the human.
 * Non-blocking — does not wait for a response.
 */
export const notifyHumanTool = defineTool({
  name: "notifyHumanTool",
  description:
    "Print a one-way status notification to the human without waiting for a response. Use for progress updates, warnings, or informational messages during long-running tasks.",
  inputSchema: z.object({
    message: z.string().describe("Notification message"),
    level: z
      .enum(["info", "success", "warning", "error"])
      .optional()
      .describe("Severity level (default: info)"),
    title: z.string().optional().describe("Optional short title"),
  }),
  outputSchema: z.string().describe("Echo of the notification message"),
  execute: async ({ message, level = "info", title }) => {
    const styles: Record<
      "info" | "success" | "warning" | "error",
      { color: string; icon: string }
    > = {
      info: { color: C.blue, icon: "ℹ" },
      success: { color: C.green, icon: "✓" },
      warning: { color: C.yellow, icon: "⚠" },
      error: { color: C.red, icon: "✗" },
    };
    const { color, icon } = styles[level];

    print("\n");
    divider(color);
    const label = title
      ? `${icon}  ${title}`
      : `${icon}  ${level.toUpperCase()}`;
    print(`${color}${C.bold}${label}${C.reset}\n`);
    print(`${message}\n`);
    divider(color);
    print("\n");

    return message;
  },
});

/**
 * Pause the agent at a checkpoint and wait for the human to press Enter.
 * Use to create explicit breakpoints in multi-step flows.
 */
export const waitForHumanTool = defineTool({
  name: "waitForHumanTool",
  description:
    "Pause the agent at a named checkpoint and wait for the human to press Enter before continuing. Use to create explicit breakpoints in multi-step flows where the human should stay in the loop.",
  inputSchema: z.object({
    checkpoint: z
      .string()
      .describe(
        "Name or description of this checkpoint (e.g. 'Pre-send review')",
      ),
    summary: z
      .string()
      .optional()
      .describe("Summary of what has happened so far"),
    nextStep: z
      .string()
      .optional()
      .describe("What the agent will do after the human continues"),
  }),
  outputSchema: z.object({
    resumedAt: z.string().describe("ISO timestamp when the human resumed"),
    elapsed: z.number().describe("Seconds the agent was paused"),
  }),
  execute: async ({ checkpoint, summary, nextStep }) => {
    const pausedAt = Date.now();

    print("\n");
    header(`Checkpoint: ${checkpoint}`, "⏸ ", C.yellow);
    if (summary) {
      print(`${C.bold}So far:${C.reset} ${summary}\n`);
    }
    if (nextStep) {
      print(`${C.bold}Next:${C.reset} ${nextStep}\n`);
    }
    print("\n");
    await prompt(`${C.yellow}Press Enter to continue…${C.reset}`);

    const resumedAt = new Date().toISOString();
    const elapsed = Math.round((Date.now() - pausedAt) / 1000);

    divider(C.yellow);
    print(
      `${C.green}▶  Resumed at ${resumedAt} (paused ${elapsed}s)${C.reset}\n\n`,
    );

    return { resumedAt, elapsed };
  },
});

/**
 * Ask the human to rate something on a numeric scale.
 * Use to collect feedback scores or priority rankings.
 */
export const rateHumanTool = defineTool({
  name: "rateHumanTool",
  description:
    "Ask the human to rate something on a numeric scale and optionally explain their rating. Use to collect feedback scores, satisfaction ratings, or priority rankings.",
  inputSchema: z.object({
    subject: z.string().describe("What is being rated"),
    min: z.number().optional().describe("Minimum value (default: 1)"),
    max: z.number().optional().describe("Maximum value (default: 5)"),
    labels: z
      .object({
        low: z.string().optional().describe("Label for the lowest value"),
        high: z.string().optional().describe("Label for the highest value"),
      })
      .optional()
      .describe("Labels for scale endpoints"),
    askReason: z
      .boolean()
      .optional()
      .describe("Also ask the human to explain their rating (default: false)"),
  }),
  outputSchema: z.object({
    rating: z.number(),
    reason: z.string().optional(),
  }),
  execute: async ({ subject, min = 1, max = 5, labels, askReason = false }) => {
    print("\n");
    header("Rate this", "⭐", C.cyan);
    print(`${C.bold}${subject}${C.reset}\n\n`);

    const lowLabel = labels?.low ? ` = ${labels.low}` : "";
    const highLabel = labels?.high ? ` = ${labels.high}` : "";
    print(
      `${C.dim}Scale: ${min}${lowLabel}  →  ${max}${highLabel}${C.reset}\n\n`,
    );

    let rating = NaN;
    while (isNaN(rating) || rating < min || rating > max) {
      const raw = await prompt(`${C.cyan}Rating (${min}–${max}):${C.reset} `);
      rating = parseFloat(raw);
      if (isNaN(rating) || rating < min || rating > max) {
        print(
          `${C.red}Please enter a number between ${min} and ${max}.${C.reset}\n`,
        );
      }
    }

    let reason: string | undefined;
    if (askReason) {
      const raw = await prompt(
        `${C.dim}Explain your rating (optional):${C.reset} `,
      );
      if (raw) reason = raw;
    }

    divider(C.cyan);
    print("\n");
    return { rating, reason };
  },
});

// ─── Export ───────────────────────────────────────────────────────────────────

export const humanTools = {
  askHumanTool,
  confirmHumanTool,
  chooseHumanTool,
  reviewHumanTool,
  collectFormHumanTool,
  notifyHumanTool,
  waitForHumanTool,
  rateHumanTool,
};
