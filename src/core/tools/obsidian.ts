import { defineTool } from "./types";
import { z } from "zod";

async function runObsidian(
  command: string,
  options: Record<string, string | boolean | undefined> = {},
  vault?: string,
): Promise<string> {
  const args: string[] = [];

  if (vault) args.push(`vault=${vault}`);
  args.push(command);

  for (const [key, value] of Object.entries(options)) {
    if (value === undefined || value === false) continue;
    if (value === true) {
      args.push(key);
    } else {
      args.push(`${key}=${value}`);
    }
  }

  const proc = Bun.spawnSync(["obsidian", ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const stdout = new TextDecoder().decode(proc.stdout).trim();
  const stderr = new TextDecoder().decode(proc.stderr).trim();

  if (proc.exitCode !== 0) {
    throw new Error(
      stderr || `obsidian ${command} failed (exit ${proc.exitCode})`,
    );
  }

  return stdout;
}

// ─── File Operations ─────────────────────────────────────────────────────────

export const obsidianReadFileTool = defineTool({
  name: "obsidianReadFileTool",
  description: "Read the contents of a file in the Obsidian vault.",
  inputSchema: z.object({
    file: z.string().optional().describe("File name (wikilink-style lookup)"),
    path: z.string().optional().describe("Exact file path (folder/note.md)"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ file, path, vault }) =>
    runObsidian("read", { file, path }, vault),
});

export const obsidianCreateFileTool = defineTool({
  name: "obsidianCreateFileTool",
  description: "Create a new file in the Obsidian vault.",
  inputSchema: z.object({
    name: z.string().optional().describe("File name"),
    path: z.string().optional().describe("File path"),
    content: z
      .string()
      .optional()
      .describe("Initial content (use \\n for newlines, \\t for tabs)"),
    template: z.string().optional().describe("Template to use"),
    overwrite: z.boolean().optional().describe("Overwrite if file exists"),
    open: z.boolean().optional().describe("Open file after creating"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ name, path, content, template, overwrite, open, vault }) =>
    runObsidian(
      "create",
      { name, path, content, template, overwrite, open },
      vault,
    ),
});

export const obsidianAppendToFileTool = defineTool({
  name: "obsidianAppendToFileTool",
  description: "Append content to an existing file in the Obsidian vault.",
  inputSchema: z.object({
    content: z
      .string()
      .describe("Content to append (use \\n for newlines, \\t for tabs)"),
    file: z.string().optional().describe("File name"),
    path: z.string().optional().describe("File path"),
    inline: z.boolean().optional().describe("Append without a leading newline"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ content, file, path, inline, vault }) =>
    runObsidian("append", { content, file, path, inline }, vault),
});

export const obsidianPrependToFileTool = defineTool({
  name: "obsidianPrependToFileTool",
  description:
    "Prepend content to the beginning of a file in the Obsidian vault.",
  inputSchema: z.object({
    content: z
      .string()
      .describe("Content to prepend (use \\n for newlines, \\t for tabs)"),
    file: z.string().optional().describe("File name"),
    path: z.string().optional().describe("File path"),
    inline: z
      .boolean()
      .optional()
      .describe("Prepend without a trailing newline"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ content, file, path, inline, vault }) =>
    runObsidian("prepend", { content, file, path, inline }, vault),
});

export const obsidianDeleteFileTool = defineTool({
  name: "obsidianDeleteFileTool",
  description:
    "Delete a file from the Obsidian vault (moves to trash unless permanent is set).",
  inputSchema: z.object({
    file: z.string().optional().describe("File name"),
    path: z.string().optional().describe("File path"),
    permanent: z
      .boolean()
      .optional()
      .describe("Skip trash and delete permanently"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ file, path, permanent, vault }) =>
    runObsidian("delete", { file, path, permanent }, vault),
});

export const obsidianMoveFileTool = defineTool({
  name: "obsidianMoveFileTool",
  description: "Move or rename a file in the Obsidian vault.",
  inputSchema: z.object({
    to: z.string().describe("Destination folder or full path (required)"),
    file: z.string().optional().describe("Source file name"),
    path: z.string().optional().describe("Source file path"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ to, file, path, vault }) =>
    runObsidian("move", { to, file, path }, vault),
});

export const obsidianRenameFileTool = defineTool({
  name: "obsidianRenameFileTool",
  description: "Rename a file in the Obsidian vault.",
  inputSchema: z.object({
    name: z.string().describe("New file name (required)"),
    file: z.string().optional().describe("Current file name"),
    path: z.string().optional().describe("Current file path"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ name, file, path, vault }) =>
    runObsidian("rename", { name, file, path }, vault),
});

export const obsidianOpenFileTool = defineTool({
  name: "obsidianOpenFileTool",
  description: "Open a file in Obsidian.",
  inputSchema: z.object({
    file: z.string().optional().describe("File name"),
    path: z.string().optional().describe("File path"),
    newtab: z.boolean().optional().describe("Open in a new tab"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ file, path, newtab, vault }) =>
    runObsidian("open", { file, path, newtab }, vault),
});

export const obsidianFileInfoTool = defineTool({
  name: "obsidianFileInfoTool",
  description:
    "Show metadata and info about a specific file in the Obsidian vault.",
  inputSchema: z.object({
    file: z.string().optional().describe("File name"),
    path: z.string().optional().describe("File path"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ file, path, vault }) =>
    runObsidian("file", { file, path }, vault),
});

// ─── Search ──────────────────────────────────────────────────────────────────

export const obsidianSearchTool = defineTool({
  name: "obsidianSearchTool",
  description:
    "Search the Obsidian vault for text and return matching file names.",
  inputSchema: z.object({
    query: z.string().describe("Search query (required)"),
    path: z.string().optional().describe("Limit search to a folder"),
    limit: z.number().optional().describe("Max number of files to return"),
    total: z.boolean().optional().describe("Return only the match count"),
    case: z.boolean().optional().describe("Case-sensitive search"),
    format: z
      .enum(["text", "json"])
      .optional()
      .describe("Output format (default: text)"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({
    query,
    path,
    limit,
    total,
    case: caseSensitive,
    format,
    vault,
  }) =>
    runObsidian(
      "search",
      {
        query,
        path,
        limit: limit?.toString(),
        total,
        case: caseSensitive,
        format,
      },
      vault,
    ),
});

export const obsidianSearchContextTool = defineTool({
  name: "obsidianSearchContextTool",
  description:
    "Search the Obsidian vault and return matching lines with surrounding context.",
  inputSchema: z.object({
    query: z.string().describe("Search query (required)"),
    path: z.string().optional().describe("Limit search to a folder"),
    limit: z.number().optional().describe("Max number of files to return"),
    case: z.boolean().optional().describe("Case-sensitive search"),
    format: z
      .enum(["text", "json"])
      .optional()
      .describe("Output format (default: text)"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ query, path, limit, case: caseSensitive, format, vault }) =>
    runObsidian(
      "search:context",
      { query, path, limit: limit?.toString(), case: caseSensitive, format },
      vault,
    ),
});

// ─── Vault & Listing ─────────────────────────────────────────────────────────

export const obsidianVaultInfoTool = defineTool({
  name: "obsidianVaultInfoTool",
  description:
    "Show information about the Obsidian vault (name, path, file count, etc.).",
  inputSchema: z.object({
    info: z
      .enum(["name", "path", "files", "folders", "size"])
      .optional()
      .describe("Return only a specific info field"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ info, vault }) => runObsidian("vault", { info }, vault),
});

export const obsidianListVaultsTool = defineTool({
  name: "obsidianListVaultsTool",
  description: "List all known Obsidian vaults.",
  inputSchema: z.object({
    total: z.boolean().optional().describe("Return only the vault count"),
    verbose: z.boolean().optional().describe("Include vault paths"),
  }),
  outputSchema: z.string(),
  execute: async ({ total, verbose }) =>
    runObsidian("vaults", { total, verbose }),
});

export const obsidianListFilesTool = defineTool({
  name: "obsidianListFilesTool",
  description:
    "List files in the Obsidian vault, optionally filtered by folder or extension.",
  inputSchema: z.object({
    folder: z.string().optional().describe("Filter by folder path"),
    ext: z.string().optional().describe("Filter by file extension (e.g. md)"),
    total: z.boolean().optional().describe("Return only the file count"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ folder, ext, total, vault }) =>
    runObsidian("files", { folder, ext, total }, vault),
});

export const obsidianListFoldersTool = defineTool({
  name: "obsidianListFoldersTool",
  description: "List folders in the Obsidian vault.",
  inputSchema: z.object({
    folder: z.string().optional().describe("Filter by parent folder"),
    total: z.boolean().optional().describe("Return only the folder count"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ folder, total, vault }) =>
    runObsidian("folders", { folder, total }, vault),
});

export const obsidianFolderInfoTool = defineTool({
  name: "obsidianFolderInfoTool",
  description:
    "Show info (file count, subfolder count, size) for a specific folder.",
  inputSchema: z.object({
    path: z.string().describe("Folder path (required)"),
    info: z
      .enum(["files", "folders", "size"])
      .optional()
      .describe("Return only a specific info field"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ path, info, vault }) =>
    runObsidian("folder", { path, info }, vault),
});

export const obsidianOrphansTool = defineTool({
  name: "obsidianOrphansTool",
  description: "List files in the vault that have no incoming links (orphans).",
  inputSchema: z.object({
    total: z.boolean().optional().describe("Return only the orphan count"),
    all: z.boolean().optional().describe("Include non-markdown files"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ total, all, vault }) =>
    runObsidian("orphans", { total, all }, vault),
});

export const obsidianDeadEndsTool = defineTool({
  name: "obsidianDeadEndsTool",
  description:
    "List files in the vault that have no outgoing links (dead ends).",
  inputSchema: z.object({
    total: z.boolean().optional().describe("Return only the dead-end count"),
    all: z.boolean().optional().describe("Include non-markdown files"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ total, all, vault }) =>
    runObsidian("deadends", { total, all }, vault),
});

export const obsidianUnresolvedLinksTool = defineTool({
  name: "obsidianUnresolvedLinksTool",
  description: "List unresolved (broken) links in the Obsidian vault.",
  inputSchema: z.object({
    total: z
      .boolean()
      .optional()
      .describe("Return only the unresolved link count"),
    counts: z.boolean().optional().describe("Include link counts"),
    verbose: z.boolean().optional().describe("Include source files"),
    format: z
      .enum(["json", "tsv", "csv"])
      .optional()
      .describe("Output format (default: tsv)"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ total, counts, verbose, format, vault }) =>
    runObsidian("unresolved", { total, counts, verbose, format }, vault),
});

// ─── Tags ────────────────────────────────────────────────────────────────────

export const obsidianListTagsTool = defineTool({
  name: "obsidianListTagsTool",
  description:
    "List all tags in the Obsidian vault (or tags in a specific file).",
  inputSchema: z.object({
    file: z.string().optional().describe("Filter tags to a specific file name"),
    path: z.string().optional().describe("Filter tags to a specific file path"),
    total: z.boolean().optional().describe("Return only the tag count"),
    counts: z.boolean().optional().describe("Include occurrence counts"),
    sort: z
      .enum(["count"])
      .optional()
      .describe("Sort by count (default: name)"),
    format: z
      .enum(["json", "tsv", "csv"])
      .optional()
      .describe("Output format (default: tsv)"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ file, path, total, counts, sort, format, vault }) =>
    runObsidian("tags", { file, path, total, counts, sort, format }, vault),
});

export const obsidianGetTagTool = defineTool({
  name: "obsidianGetTagTool",
  description: "Get info about a specific tag, including files that use it.",
  inputSchema: z.object({
    name: z.string().describe("Tag name (required)"),
    total: z.boolean().optional().describe("Return only the occurrence count"),
    verbose: z.boolean().optional().describe("Include file list and count"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ name, total, verbose, vault }) =>
    runObsidian("tag", { name, total, verbose }, vault),
});

// ─── Properties ──────────────────────────────────────────────────────────────

export const obsidianListPropertiesTool = defineTool({
  name: "obsidianListPropertiesTool",
  description:
    "List frontmatter properties in the vault or for a specific file.",
  inputSchema: z.object({
    file: z
      .string()
      .optional()
      .describe("Show properties for a file (by name)"),
    path: z
      .string()
      .optional()
      .describe("Show properties for a file (by path)"),
    name: z.string().optional().describe("Get count for a specific property"),
    total: z.boolean().optional().describe("Return only the property count"),
    sort: z
      .enum(["count"])
      .optional()
      .describe("Sort by count (default: name)"),
    counts: z.boolean().optional().describe("Include occurrence counts"),
    format: z
      .enum(["yaml", "json", "tsv"])
      .optional()
      .describe("Output format (default: yaml)"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ file, path, name, total, sort, counts, format, vault }) =>
    runObsidian(
      "properties",
      { file, path, name, total, sort, counts, format },
      vault,
    ),
});

export const obsidianReadPropertyTool = defineTool({
  name: "obsidianReadPropertyTool",
  description: "Read the value of a specific frontmatter property from a file.",
  inputSchema: z.object({
    name: z.string().describe("Property name (required)"),
    file: z.string().optional().describe("File name"),
    path: z.string().optional().describe("File path"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ name, file, path, vault }) =>
    runObsidian("property:read", { name, file, path }, vault),
});

export const obsidianSetPropertyTool = defineTool({
  name: "obsidianSetPropertyTool",
  description: "Set a frontmatter property on a file in the Obsidian vault.",
  inputSchema: z.object({
    name: z.string().describe("Property name (required)"),
    value: z.string().describe("Property value (required)"),
    type: z
      .enum(["text", "list", "number", "checkbox", "date", "datetime"])
      .optional()
      .describe("Property type"),
    file: z.string().optional().describe("File name"),
    path: z.string().optional().describe("File path"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ name, value, type, file, path, vault }) =>
    runObsidian("property:set", { name, value, type, file, path }, vault),
});

export const obsidianRemovePropertyTool = defineTool({
  name: "obsidianRemovePropertyTool",
  description:
    "Remove a frontmatter property from a file in the Obsidian vault.",
  inputSchema: z.object({
    name: z.string().describe("Property name (required)"),
    file: z.string().optional().describe("File name"),
    path: z.string().optional().describe("File path"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ name, file, path, vault }) =>
    runObsidian("property:remove", { name, file, path }, vault),
});

// ─── Links & Aliases ─────────────────────────────────────────────────────────

export const obsidianGetLinksTool = defineTool({
  name: "obsidianGetLinksTool",
  description: "List outgoing links from a file in the Obsidian vault.",
  inputSchema: z.object({
    file: z.string().optional().describe("File name"),
    path: z.string().optional().describe("File path"),
    total: z.boolean().optional().describe("Return only the link count"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ file, path, total, vault }) =>
    runObsidian("links", { file, path, total }, vault),
});

export const obsidianGetBacklinksTool = defineTool({
  name: "obsidianGetBacklinksTool",
  description:
    "List files that link to a given file (backlinks) in the Obsidian vault.",
  inputSchema: z.object({
    file: z.string().optional().describe("Target file name"),
    path: z.string().optional().describe("Target file path"),
    counts: z.boolean().optional().describe("Include link counts"),
    total: z.boolean().optional().describe("Return only the backlink count"),
    format: z
      .enum(["json", "tsv", "csv"])
      .optional()
      .describe("Output format (default: tsv)"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ file, path, counts, total, format, vault }) =>
    runObsidian("backlinks", { file, path, counts, total, format }, vault),
});

export const obsidianListAliasesTool = defineTool({
  name: "obsidianListAliasesTool",
  description: "List aliases defined in vault files.",
  inputSchema: z.object({
    file: z.string().optional().describe("Filter by file name"),
    path: z.string().optional().describe("Filter by file path"),
    total: z.boolean().optional().describe("Return only the alias count"),
    verbose: z.boolean().optional().describe("Include file paths"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ file, path, total, verbose, vault }) =>
    runObsidian("aliases", { file, path, total, verbose }, vault),
});

// ─── Outline & Word Count ─────────────────────────────────────────────────────

export const obsidianOutlineTool = defineTool({
  name: "obsidianOutlineTool",
  description: "Show the heading outline of a file in the Obsidian vault.",
  inputSchema: z.object({
    file: z.string().optional().describe("File name"),
    path: z.string().optional().describe("File path"),
    format: z
      .enum(["tree", "md", "json"])
      .optional()
      .describe("Output format (default: tree)"),
    total: z.boolean().optional().describe("Return only the heading count"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ file, path, format, total, vault }) =>
    runObsidian("outline", { file, path, format, total }, vault),
});

export const obsidianWordCountTool = defineTool({
  name: "obsidianWordCountTool",
  description: "Count words and characters in a file in the Obsidian vault.",
  inputSchema: z.object({
    file: z.string().optional().describe("File name"),
    path: z.string().optional().describe("File path"),
    words: z.boolean().optional().describe("Return only the word count"),
    characters: z
      .boolean()
      .optional()
      .describe("Return only the character count"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ file, path, words, characters, vault }) =>
    runObsidian("wordcount", { file, path, words, characters }, vault),
});

// ─── Daily Notes ─────────────────────────────────────────────────────────────

export const obsidianDailyNoteReadTool = defineTool({
  name: "obsidianDailyNoteReadTool",
  description: "Read the contents of today's daily note in Obsidian.",
  inputSchema: z.object({
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ vault }) => runObsidian("daily:read", {}, vault),
});

export const obsidianDailyNotePathTool = defineTool({
  name: "obsidianDailyNotePathTool",
  description: "Get the file path of today's daily note in Obsidian.",
  inputSchema: z.object({
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ vault }) => runObsidian("daily:path", {}, vault),
});

export const obsidianOpenDailyNoteTool = defineTool({
  name: "obsidianOpenDailyNoteTool",
  description: "Open today's daily note in Obsidian.",
  inputSchema: z.object({
    paneType: z
      .enum(["tab", "split", "window"])
      .optional()
      .describe("Where to open the note"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ paneType, vault }) =>
    runObsidian("daily", { paneType }, vault),
});

export const obsidianDailyNoteAppendTool = defineTool({
  name: "obsidianDailyNoteAppendTool",
  description: "Append content to today's daily note in Obsidian.",
  inputSchema: z.object({
    content: z
      .string()
      .describe("Content to append (use \\n for newlines, \\t for tabs)"),
    inline: z.boolean().optional().describe("Append without a leading newline"),
    open: z.boolean().optional().describe("Open the note after appending"),
    paneType: z
      .enum(["tab", "split", "window"])
      .optional()
      .describe("Pane type when opening"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ content, inline, open, paneType, vault }) =>
    runObsidian("daily:append", { content, inline, open, paneType }, vault),
});

export const obsidianDailyNotePrependTool = defineTool({
  name: "obsidianDailyNotePrependTool",
  description: "Prepend content to today's daily note in Obsidian.",
  inputSchema: z.object({
    content: z
      .string()
      .describe("Content to prepend (use \\n for newlines, \\t for tabs)"),
    inline: z
      .boolean()
      .optional()
      .describe("Prepend without a trailing newline"),
    open: z.boolean().optional().describe("Open the note after prepending"),
    paneType: z
      .enum(["tab", "split", "window"])
      .optional()
      .describe("Pane type when opening"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ content, inline, open, paneType, vault }) =>
    runObsidian("daily:prepend", { content, inline, open, paneType }, vault),
});

// ─── Tasks ───────────────────────────────────────────────────────────────────

export const obsidianListTasksTool = defineTool({
  name: "obsidianListTasksTool",
  description: "List tasks in the Obsidian vault with filtering options.",
  inputSchema: z.object({
    file: z.string().optional().describe("Filter by file name"),
    path: z.string().optional().describe("Filter by file path"),
    total: z.boolean().optional().describe("Return only the task count"),
    done: z.boolean().optional().describe("Show only completed tasks"),
    todo: z.boolean().optional().describe("Show only incomplete tasks"),
    status: z.string().optional().describe("Filter by status character"),
    verbose: z.boolean().optional().describe("Group by file with line numbers"),
    format: z
      .enum(["json", "tsv", "csv", "text"])
      .optional()
      .describe("Output format (default: text)"),
    daily: z.boolean().optional().describe("Show tasks from daily note only"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({
    file,
    path,
    total,
    done,
    todo,
    status,
    verbose,
    format,
    daily,
    vault,
  }) =>
    runObsidian(
      "tasks",
      { file, path, total, done, todo, status, verbose, format, daily },
      vault,
    ),
});

export const obsidianTaskActionTool = defineTool({
  name: "obsidianTaskActionTool",
  description:
    "Show or update a specific task in the Obsidian vault (toggle, mark done/todo, or set a custom status).",
  inputSchema: z.object({
    ref: z.string().optional().describe("Task reference in path:line format"),
    file: z.string().optional().describe("File name"),
    path: z.string().optional().describe("File path"),
    line: z.number().optional().describe("Line number of the task"),
    toggle: z
      .boolean()
      .optional()
      .describe("Toggle the task completion status"),
    done: z.boolean().optional().describe("Mark task as done"),
    todo: z.boolean().optional().describe("Mark task as todo"),
    status: z.string().optional().describe("Set custom status character"),
    daily: z.boolean().optional().describe("Use the daily note"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({
    ref,
    file,
    path,
    line,
    toggle,
    done,
    todo,
    status,
    daily,
    vault,
  }) =>
    runObsidian(
      "task",
      {
        ref,
        file,
        path,
        line: line?.toString(),
        toggle,
        done,
        todo,
        status,
        daily,
      },
      vault,
    ),
});

// ─── Bookmarks ───────────────────────────────────────────────────────────────

export const obsidianListBookmarksTool = defineTool({
  name: "obsidianListBookmarksTool",
  description: "List all bookmarks in the Obsidian vault.",
  inputSchema: z.object({
    total: z.boolean().optional().describe("Return only the bookmark count"),
    verbose: z.boolean().optional().describe("Include bookmark types"),
    format: z
      .enum(["json", "tsv", "csv"])
      .optional()
      .describe("Output format (default: tsv)"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ total, verbose, format, vault }) =>
    runObsidian("bookmarks", { total, verbose, format }, vault),
});

export const obsidianAddBookmarkTool = defineTool({
  name: "obsidianAddBookmarkTool",
  description: "Add a bookmark in the Obsidian vault.",
  inputSchema: z.object({
    file: z.string().optional().describe("File path to bookmark"),
    subpath: z
      .string()
      .optional()
      .describe("Heading or block subpath within the file"),
    folder: z.string().optional().describe("Folder path to bookmark"),
    search: z.string().optional().describe("Search query to bookmark"),
    url: z.string().optional().describe("URL to bookmark"),
    title: z.string().optional().describe("Bookmark title"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ file, subpath, folder, search, url, title, vault }) =>
    runObsidian(
      "bookmark",
      { file, subpath, folder, search, url, title },
      vault,
    ),
});

// ─── Templates ───────────────────────────────────────────────────────────────

export const obsidianListTemplatesTool = defineTool({
  name: "obsidianListTemplatesTool",
  description: "List available templates in the Obsidian vault.",
  inputSchema: z.object({
    total: z.boolean().optional().describe("Return only the template count"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ total, vault }) =>
    runObsidian("templates", { total }, vault),
});

export const obsidianReadTemplateTool = defineTool({
  name: "obsidianReadTemplateTool",
  description: "Read the contents of an Obsidian template.",
  inputSchema: z.object({
    name: z.string().describe("Template name (required)"),
    resolve: z.boolean().optional().describe("Resolve template variables"),
    title: z
      .string()
      .optional()
      .describe("Title to use when resolving variables"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ name, resolve, title, vault }) =>
    runObsidian("template:read", { name, resolve, title }, vault),
});

export const obsidianInsertTemplateTool = defineTool({
  name: "obsidianInsertTemplateTool",
  description: "Insert a template into the currently active file in Obsidian.",
  inputSchema: z.object({
    name: z.string().describe("Template name (required)"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ name, vault }) =>
    runObsidian("template:insert", { name }, vault),
});

// ─── Plugins ─────────────────────────────────────────────────────────────────

export const obsidianListPluginsTool = defineTool({
  name: "obsidianListPluginsTool",
  description: "List installed plugins in the Obsidian vault.",
  inputSchema: z.object({
    filter: z
      .enum(["core", "community"])
      .optional()
      .describe("Filter by plugin type"),
    versions: z.boolean().optional().describe("Include version numbers"),
    format: z
      .enum(["json", "tsv", "csv"])
      .optional()
      .describe("Output format (default: tsv)"),
    enabledOnly: z.boolean().optional().describe("List only enabled plugins"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ filter, versions, format, enabledOnly, vault }) =>
    runObsidian(
      enabledOnly ? "plugins:enabled" : "plugins",
      { filter, versions, format },
      vault,
    ),
});

export const obsidianGetPluginTool = defineTool({
  name: "obsidianGetPluginTool",
  description: "Get information about a specific Obsidian plugin.",
  inputSchema: z.object({
    id: z.string().describe("Plugin ID (required)"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ id, vault }) => runObsidian("plugin", { id }, vault),
});

export const obsidianEnablePluginTool = defineTool({
  name: "obsidianEnablePluginTool",
  description: "Enable an installed plugin in Obsidian.",
  inputSchema: z.object({
    id: z.string().describe("Plugin ID (required)"),
    filter: z.enum(["core", "community"]).optional().describe("Plugin type"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ id, filter, vault }) =>
    runObsidian("plugin:enable", { id, filter }, vault),
});

export const obsidianDisablePluginTool = defineTool({
  name: "obsidianDisablePluginTool",
  description: "Disable an installed plugin in Obsidian.",
  inputSchema: z.object({
    id: z.string().describe("Plugin ID (required)"),
    filter: z.enum(["core", "community"]).optional().describe("Plugin type"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ id, filter, vault }) =>
    runObsidian("plugin:disable", { id, filter }, vault),
});

export const obsidianInstallPluginTool = defineTool({
  name: "obsidianInstallPluginTool",
  description: "Install a community plugin in Obsidian.",
  inputSchema: z.object({
    id: z.string().describe("Plugin ID (required)"),
    enable: z
      .boolean()
      .optional()
      .describe("Enable the plugin after installing"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ id, enable, vault }) =>
    runObsidian("plugin:install", { id, enable }, vault),
});

export const obsidianUninstallPluginTool = defineTool({
  name: "obsidianUninstallPluginTool",
  description: "Uninstall a community plugin from Obsidian.",
  inputSchema: z.object({
    id: z.string().describe("Plugin ID (required)"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ id, vault }) =>
    runObsidian("plugin:uninstall", { id }, vault),
});

export const obsidianReloadPluginTool = defineTool({
  name: "obsidianReloadPluginTool",
  description:
    "Reload a plugin in Obsidian (useful during plugin development).",
  inputSchema: z.object({
    id: z.string().describe("Plugin ID (required)"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ id, vault }) => runObsidian("plugin:reload", { id }, vault),
});

// ─── Themes ───────────────────────────────────────────────────────────────────

export const obsidianListThemesTool = defineTool({
  name: "obsidianListThemesTool",
  description: "List installed themes in Obsidian.",
  inputSchema: z.object({
    versions: z.boolean().optional().describe("Include version numbers"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ versions, vault }) =>
    runObsidian("themes", { versions }, vault),
});

export const obsidianGetThemeTool = defineTool({
  name: "obsidianGetThemeTool",
  description:
    "Show the active theme or get info about a specific installed theme.",
  inputSchema: z.object({
    name: z.string().optional().describe("Theme name for details"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ name, vault }) => runObsidian("theme", { name }, vault),
});

export const obsidianSetThemeTool = defineTool({
  name: "obsidianSetThemeTool",
  description:
    "Set the active theme in Obsidian (pass empty string to restore default).",
  inputSchema: z.object({
    name: z.string().describe("Theme name (pass empty string for default)"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ name, vault }) => runObsidian("theme:set", { name }, vault),
});

export const obsidianInstallThemeTool = defineTool({
  name: "obsidianInstallThemeTool",
  description: "Install a community theme in Obsidian.",
  inputSchema: z.object({
    name: z.string().describe("Theme name (required)"),
    enable: z
      .boolean()
      .optional()
      .describe("Activate the theme after installing"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ name, enable, vault }) =>
    runObsidian("theme:install", { name, enable }, vault),
});

export const obsidianUninstallThemeTool = defineTool({
  name: "obsidianUninstallThemeTool",
  description: "Uninstall a theme from Obsidian.",
  inputSchema: z.object({
    name: z.string().describe("Theme name (required)"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ name, vault }) =>
    runObsidian("theme:uninstall", { name }, vault),
});

// ─── CSS Snippets ─────────────────────────────────────────────────────────────

export const obsidianListSnippetsTool = defineTool({
  name: "obsidianListSnippetsTool",
  description: "List installed CSS snippets in Obsidian.",
  inputSchema: z.object({
    enabledOnly: z.boolean().optional().describe("List only enabled snippets"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ enabledOnly, vault }) =>
    runObsidian(enabledOnly ? "snippets:enabled" : "snippets", {}, vault),
});

export const obsidianToggleSnippetTool = defineTool({
  name: "obsidianToggleSnippetTool",
  description: "Enable or disable a CSS snippet in Obsidian.",
  inputSchema: z.object({
    name: z.string().describe("Snippet name (required)"),
    action: z
      .enum(["enable", "disable"])
      .describe("Whether to enable or disable the snippet"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ name, action, vault }) =>
    runObsidian(`snippet:${action}`, { name }, vault),
});

// ─── Sync ────────────────────────────────────────────────────────────────────

export const obsidianSyncControlTool = defineTool({
  name: "obsidianSyncControlTool",
  description: "Pause or resume Obsidian Sync.",
  inputSchema: z.object({
    action: z
      .enum(["on", "off"])
      .describe("on = resume sync, off = pause sync"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ action, vault }) =>
    runObsidian("sync", { [action]: true }, vault),
});

export const obsidianSyncStatusTool = defineTool({
  name: "obsidianSyncStatusTool",
  description: "Show the current Obsidian Sync status.",
  inputSchema: z.object({
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ vault }) => runObsidian("sync:status", {}, vault),
});

export const obsidianSyncHistoryTool = defineTool({
  name: "obsidianSyncHistoryTool",
  description: "List sync version history for a file in Obsidian Sync.",
  inputSchema: z.object({
    file: z.string().optional().describe("File name"),
    path: z.string().optional().describe("File path"),
    total: z.boolean().optional().describe("Return only the version count"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ file, path, total, vault }) =>
    runObsidian("sync:history", { file, path, total }, vault),
});

export const obsidianSyncDeletedTool = defineTool({
  name: "obsidianSyncDeletedTool",
  description: "List deleted files tracked by Obsidian Sync.",
  inputSchema: z.object({
    total: z
      .boolean()
      .optional()
      .describe("Return only the deleted file count"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ total, vault }) =>
    runObsidian("sync:deleted", { total }, vault),
});

export const obsidianSyncReadVersionTool = defineTool({
  name: "obsidianSyncReadVersionTool",
  description: "Read a specific sync version of a file from Obsidian Sync.",
  inputSchema: z.object({
    version: z.number().describe("Version number (required)"),
    file: z.string().optional().describe("File name"),
    path: z.string().optional().describe("File path"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ version, file, path, vault }) =>
    runObsidian(
      "sync:read",
      { version: version.toString(), file, path },
      vault,
    ),
});

export const obsidianSyncRestoreVersionTool = defineTool({
  name: "obsidianSyncRestoreVersionTool",
  description: "Restore a file to a specific sync version in Obsidian Sync.",
  inputSchema: z.object({
    version: z.number().describe("Version number (required)"),
    file: z.string().optional().describe("File name"),
    path: z.string().optional().describe("File path"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ version, file, path, vault }) =>
    runObsidian(
      "sync:restore",
      { version: version.toString(), file, path },
      vault,
    ),
});

// ─── File History (Local Recovery) ───────────────────────────────────────────

export const obsidianHistoryListTool = defineTool({
  name: "obsidianHistoryListTool",
  description: "List local version history for a file in Obsidian.",
  inputSchema: z.object({
    file: z.string().optional().describe("File name"),
    path: z.string().optional().describe("File path"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ file, path, vault }) =>
    runObsidian("history", { file, path }, vault),
});

export const obsidianHistoryReadTool = defineTool({
  name: "obsidianHistoryReadTool",
  description: "Read a specific local history version of a file in Obsidian.",
  inputSchema: z.object({
    version: z.number().optional().describe("Version number (default: 1)"),
    file: z.string().optional().describe("File name"),
    path: z.string().optional().describe("File path"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ version, file, path, vault }) =>
    runObsidian(
      "history:read",
      { version: version?.toString(), file, path },
      vault,
    ),
});

export const obsidianHistoryRestoreTool = defineTool({
  name: "obsidianHistoryRestoreTool",
  description:
    "Restore a file to a specific local history version in Obsidian.",
  inputSchema: z.object({
    version: z.number().describe("Version number (required)"),
    file: z.string().optional().describe("File name"),
    path: z.string().optional().describe("File path"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ version, file, path, vault }) =>
    runObsidian(
      "history:restore",
      { version: version.toString(), file, path },
      vault,
    ),
});

// ─── Bases ───────────────────────────────────────────────────────────────────

export const obsidianListBasesTool = defineTool({
  name: "obsidianListBasesTool",
  description: "List all base files (Obsidian Bases) in the vault.",
  inputSchema: z.object({
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ vault }) => runObsidian("bases", {}, vault),
});

export const obsidianQueryBaseTool = defineTool({
  name: "obsidianQueryBaseTool",
  description: "Query an Obsidian Base and return results.",
  inputSchema: z.object({
    file: z.string().optional().describe("Base file name"),
    path: z.string().optional().describe("Base file path"),
    view: z.string().optional().describe("View name to query"),
    format: z
      .enum(["json", "csv", "tsv", "md", "paths"])
      .optional()
      .describe("Output format (default: json)"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ file, path, view, format, vault }) =>
    runObsidian("base:query", { file, path, view, format }, vault),
});

export const obsidianCreateBaseItemTool = defineTool({
  name: "obsidianCreateBaseItemTool",
  description: "Create a new item in an Obsidian Base.",
  inputSchema: z.object({
    file: z.string().optional().describe("Base file name"),
    path: z.string().optional().describe("Base file path"),
    view: z.string().optional().describe("View name"),
    name: z.string().optional().describe("New item file name"),
    content: z.string().optional().describe("Initial content"),
    open: z.boolean().optional().describe("Open file after creating"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ file, path, view, name, content, open, vault }) =>
    runObsidian(
      "base:create",
      { file, path, view, name, content, open },
      vault,
    ),
});

export const obsidianBaseViewsTool = defineTool({
  name: "obsidianBaseViewsTool",
  description: "List views in the current Obsidian Base file.",
  inputSchema: z.object({
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ vault }) => runObsidian("base:views", {}, vault),
});

// ─── Commands & Hotkeys ───────────────────────────────────────────────────────

export const obsidianListCommandsTool = defineTool({
  name: "obsidianListCommandsTool",
  description: "List all available commands in the Obsidian command palette.",
  inputSchema: z.object({
    filter: z.string().optional().describe("Filter commands by ID prefix"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ filter, vault }) =>
    runObsidian("commands", { filter }, vault),
});

export const obsidianExecuteCommandTool = defineTool({
  name: "obsidianExecuteCommandTool",
  description: "Execute an Obsidian command by its command ID.",
  inputSchema: z.object({
    id: z.string().describe("Command ID to execute (required)"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ id, vault }) => runObsidian("command", { id }, vault),
});

export const obsidianListHotkeysTool = defineTool({
  name: "obsidianListHotkeysTool",
  description: "List hotkeys configured in Obsidian.",
  inputSchema: z.object({
    total: z.boolean().optional().describe("Return only the hotkey count"),
    verbose: z
      .boolean()
      .optional()
      .describe("Show whether each hotkey is custom or default"),
    all: z.boolean().optional().describe("Include commands without hotkeys"),
    format: z
      .enum(["json", "tsv", "csv"])
      .optional()
      .describe("Output format (default: tsv)"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ total, verbose, all, format, vault }) =>
    runObsidian("hotkeys", { total, verbose, all, format }, vault),
});

export const obsidianGetHotkeyTool = defineTool({
  name: "obsidianGetHotkeyTool",
  description: "Get the hotkey configured for a specific Obsidian command.",
  inputSchema: z.object({
    id: z.string().describe("Command ID (required)"),
    verbose: z
      .boolean()
      .optional()
      .describe("Show whether it is custom or default"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ id, verbose, vault }) =>
    runObsidian("hotkey", { id, verbose }, vault),
});

// ─── Utility ─────────────────────────────────────────────────────────────────

export const obsidianVersionTool = defineTool({
  name: "obsidianVersionTool",
  description: "Show the current Obsidian version.",
  inputSchema: z.object({}),
  outputSchema: z.string(),
  execute: async () => runObsidian("version"),
});

export const obsidianRandomReadTool = defineTool({
  name: "obsidianRandomReadTool",
  description: "Read a random note from the Obsidian vault.",
  inputSchema: z.object({
    folder: z.string().optional().describe("Limit to a specific folder"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ folder, vault }) =>
    runObsidian("random:read", { folder }, vault),
});

export const obsidianRecentFilesTool = defineTool({
  name: "obsidianRecentFilesTool",
  description: "List recently opened files in Obsidian.",
  inputSchema: z.object({
    total: z.boolean().optional().describe("Return only the count"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ total, vault }) => runObsidian("recents", { total }, vault),
});

export const obsidianWorkspaceTool = defineTool({
  name: "obsidianWorkspaceTool",
  description: "Show the current Obsidian workspace layout tree.",
  inputSchema: z.object({
    ids: z.boolean().optional().describe("Include workspace item IDs"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ ids, vault }) => runObsidian("workspace", { ids }, vault),
});

export const obsidianListTabsTool = defineTool({
  name: "obsidianListTabsTool",
  description: "List currently open tabs in Obsidian.",
  inputSchema: z.object({
    ids: z.boolean().optional().describe("Include tab IDs"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ ids, vault }) => runObsidian("tabs", { ids }, vault),
});

export const obsidianDiffTool = defineTool({
  name: "obsidianDiffTool",
  description: "List or diff local vs sync versions of a file in Obsidian.",
  inputSchema: z.object({
    file: z.string().optional().describe("File name"),
    path: z.string().optional().describe("File path"),
    from: z.number().optional().describe("Version number to diff from"),
    to: z.number().optional().describe("Version number to diff to"),
    filter: z
      .enum(["local", "sync"])
      .optional()
      .describe("Filter by version source"),
    vault: z.string().optional().describe("Target vault name"),
  }),
  outputSchema: z.string(),
  execute: async ({ file, path, from, to, filter, vault }) =>
    runObsidian(
      "diff",
      { file, path, from: from?.toString(), to: to?.toString(), filter },
      vault,
    ),
});

// ─── Export ───────────────────────────────────────────────────────────────────

export const obsidianTools = {
  // File operations
  obsidianReadFileTool,
  obsidianCreateFileTool,
  obsidianAppendToFileTool,
  obsidianPrependToFileTool,
  obsidianDeleteFileTool,
  obsidianMoveFileTool,
  obsidianRenameFileTool,
  obsidianOpenFileTool,
  obsidianFileInfoTool,
  // Search
  obsidianSearchTool,
  obsidianSearchContextTool,
  // Vault & listing
  obsidianVaultInfoTool,
  obsidianListVaultsTool,
  obsidianListFilesTool,
  obsidianListFoldersTool,
  obsidianFolderInfoTool,
  obsidianOrphansTool,
  obsidianDeadEndsTool,
  obsidianUnresolvedLinksTool,
  // Tags
  obsidianListTagsTool,
  obsidianGetTagTool,
  // Properties
  obsidianListPropertiesTool,
  obsidianReadPropertyTool,
  obsidianSetPropertyTool,
  obsidianRemovePropertyTool,
  // Links & aliases
  obsidianGetLinksTool,
  obsidianGetBacklinksTool,
  obsidianListAliasesTool,
  // Outline & word count
  obsidianOutlineTool,
  obsidianWordCountTool,
  // Daily notes
  obsidianDailyNoteReadTool,
  obsidianDailyNotePathTool,
  obsidianOpenDailyNoteTool,
  obsidianDailyNoteAppendTool,
  obsidianDailyNotePrependTool,
  // Tasks
  obsidianListTasksTool,
  obsidianTaskActionTool,
  // Bookmarks
  obsidianListBookmarksTool,
  obsidianAddBookmarkTool,
  // Templates
  obsidianListTemplatesTool,
  obsidianReadTemplateTool,
  obsidianInsertTemplateTool,
  // Plugins
  obsidianListPluginsTool,
  obsidianGetPluginTool,
  obsidianEnablePluginTool,
  obsidianDisablePluginTool,
  obsidianInstallPluginTool,
  obsidianUninstallPluginTool,
  obsidianReloadPluginTool,
  // Themes
  obsidianListThemesTool,
  obsidianGetThemeTool,
  obsidianSetThemeTool,
  obsidianInstallThemeTool,
  obsidianUninstallThemeTool,
  // CSS snippets
  obsidianListSnippetsTool,
  obsidianToggleSnippetTool,
  // Sync
  obsidianSyncControlTool,
  obsidianSyncStatusTool,
  obsidianSyncHistoryTool,
  obsidianSyncDeletedTool,
  obsidianSyncReadVersionTool,
  obsidianSyncRestoreVersionTool,
  // File history
  obsidianHistoryListTool,
  obsidianHistoryReadTool,
  obsidianHistoryRestoreTool,
  // Bases
  obsidianListBasesTool,
  obsidianQueryBaseTool,
  obsidianCreateBaseItemTool,
  obsidianBaseViewsTool,
  // Commands & hotkeys
  obsidianListCommandsTool,
  obsidianExecuteCommandTool,
  obsidianListHotkeysTool,
  obsidianGetHotkeyTool,
  // Utility
  obsidianVersionTool,
  obsidianRandomReadTool,
  obsidianRecentFilesTool,
  obsidianWorkspaceTool,
  obsidianListTabsTool,
  obsidianDiffTool,
};
