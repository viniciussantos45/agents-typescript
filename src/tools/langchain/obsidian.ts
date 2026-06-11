import { tool } from "langchain";
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

export const obsidianReadFileTool = tool(
  async ({ file, path, vault }) => runObsidian("read", { file, path }, vault),
  {
    name: "obsidian_read_file",
    description: "Read the contents of a file in the Obsidian vault.",
    schema: z.object({
      file: z.string().optional().describe("File name (wikilink-style lookup)"),
      path: z.string().optional().describe("Exact file path (folder/note.md)"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianCreateFileTool = tool(
  async ({ name, path, content, template, overwrite, open, vault }) =>
    runObsidian(
      "create",
      { name, path, content, template, overwrite, open },
      vault,
    ),
  {
    name: "obsidian_create_file",
    description: "Create a new file in the Obsidian vault.",
    schema: z.object({
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
  },
);

export const obsidianAppendToFileTool = tool(
  async ({ content, file, path, inline, vault }) =>
    runObsidian("append", { content, file, path, inline }, vault),
  {
    name: "obsidian_append_to_file",
    description: "Append content to an existing file in the Obsidian vault.",
    schema: z.object({
      content: z
        .string()
        .describe("Content to append (use \\n for newlines, \\t for tabs)"),
      file: z.string().optional().describe("File name"),
      path: z.string().optional().describe("File path"),
      inline: z
        .boolean()
        .optional()
        .describe("Append without a leading newline"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianPrependToFileTool = tool(
  async ({ content, file, path, inline, vault }) =>
    runObsidian("prepend", { content, file, path, inline }, vault),
  {
    name: "obsidian_prepend_to_file",
    description:
      "Prepend content to the beginning of a file in the Obsidian vault.",
    schema: z.object({
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
  },
);

export const obsidianDeleteFileTool = tool(
  async ({ file, path, permanent, vault }) =>
    runObsidian("delete", { file, path, permanent }, vault),
  {
    name: "obsidian_delete_file",
    description:
      "Delete a file from the Obsidian vault (moves to trash unless permanent is set).",
    schema: z.object({
      file: z.string().optional().describe("File name"),
      path: z.string().optional().describe("File path"),
      permanent: z
        .boolean()
        .optional()
        .describe("Skip trash and delete permanently"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianMoveFileTool = tool(
  async ({ to, file, path, vault }) =>
    runObsidian("move", { to, file, path }, vault),
  {
    name: "obsidian_move_file",
    description: "Move or rename a file in the Obsidian vault.",
    schema: z.object({
      to: z.string().describe("Destination folder or full path (required)"),
      file: z.string().optional().describe("Source file name"),
      path: z.string().optional().describe("Source file path"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianRenameFileTool = tool(
  async ({ name, file, path, vault }) =>
    runObsidian("rename", { name, file, path }, vault),
  {
    name: "obsidian_rename_file",
    description: "Rename a file in the Obsidian vault.",
    schema: z.object({
      name: z.string().describe("New file name (required)"),
      file: z.string().optional().describe("Current file name"),
      path: z.string().optional().describe("Current file path"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianOpenFileTool = tool(
  async ({ file, path, newtab, vault }) =>
    runObsidian("open", { file, path, newtab }, vault),
  {
    name: "obsidian_open_file",
    description: "Open a file in Obsidian.",
    schema: z.object({
      file: z.string().optional().describe("File name"),
      path: z.string().optional().describe("File path"),
      newtab: z.boolean().optional().describe("Open in a new tab"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianFileInfoTool = tool(
  async ({ file, path, vault }) => runObsidian("file", { file, path }, vault),
  {
    name: "obsidian_file_info",
    description:
      "Show metadata and info about a specific file in the Obsidian vault.",
    schema: z.object({
      file: z.string().optional().describe("File name"),
      path: z.string().optional().describe("File path"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

// ─── Search ──────────────────────────────────────────────────────────────────

export const obsidianSearchTool = tool(
  async ({ query, path, limit, total, case: caseSensitive, format, vault }) =>
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
  {
    name: "obsidian_search",
    description:
      "Search the Obsidian vault for text and return matching file names.",
    schema: z.object({
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
  },
);

export const obsidianSearchContextTool = tool(
  async ({ query, path, limit, case: caseSensitive, format, vault }) =>
    runObsidian(
      "search:context",
      { query, path, limit: limit?.toString(), case: caseSensitive, format },
      vault,
    ),
  {
    name: "obsidian_search_context",
    description:
      "Search the Obsidian vault and return matching lines with surrounding context.",
    schema: z.object({
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
  },
);

// ─── Vault & Listing ─────────────────────────────────────────────────────────

export const obsidianVaultInfoTool = tool(
  async ({ info, vault }) => runObsidian("vault", { info }, vault),
  {
    name: "obsidian_vault_info",
    description:
      "Show information about the Obsidian vault (name, path, file count, etc.).",
    schema: z.object({
      info: z
        .enum(["name", "path", "files", "folders", "size"])
        .optional()
        .describe("Return only a specific info field"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianListVaultsTool = tool(
  async ({ total, verbose }) => runObsidian("vaults", { total, verbose }),
  {
    name: "obsidian_list_vaults",
    description: "List all known Obsidian vaults.",
    schema: z.object({
      total: z.boolean().optional().describe("Return only the vault count"),
      verbose: z.boolean().optional().describe("Include vault paths"),
    }),
  },
);

export const obsidianListFilesTool = tool(
  async ({ folder, ext, total, vault }) =>
    runObsidian("files", { folder, ext, total }, vault),
  {
    name: "obsidian_list_files",
    description:
      "List files in the Obsidian vault, optionally filtered by folder or extension.",
    schema: z.object({
      folder: z.string().optional().describe("Filter by folder path"),
      ext: z.string().optional().describe("Filter by file extension (e.g. md)"),
      total: z.boolean().optional().describe("Return only the file count"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianListFoldersTool = tool(
  async ({ folder, total, vault }) =>
    runObsidian("folders", { folder, total }, vault),
  {
    name: "obsidian_list_folders",
    description: "List folders in the Obsidian vault.",
    schema: z.object({
      folder: z.string().optional().describe("Filter by parent folder"),
      total: z.boolean().optional().describe("Return only the folder count"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianFolderInfoTool = tool(
  async ({ path, info, vault }) =>
    runObsidian("folder", { path, info }, vault),
  {
    name: "obsidian_folder_info",
    description:
      "Show info (file count, subfolder count, size) for a specific folder.",
    schema: z.object({
      path: z.string().describe("Folder path (required)"),
      info: z
        .enum(["files", "folders", "size"])
        .optional()
        .describe("Return only a specific info field"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianOrphansTool = tool(
  async ({ total, all, vault }) =>
    runObsidian("orphans", { total, all }, vault),
  {
    name: "obsidian_orphans",
    description:
      "List files in the vault that have no incoming links (orphans).",
    schema: z.object({
      total: z.boolean().optional().describe("Return only the orphan count"),
      all: z.boolean().optional().describe("Include non-markdown files"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianDeadEndsTool = tool(
  async ({ total, all, vault }) =>
    runObsidian("deadends", { total, all }, vault),
  {
    name: "obsidian_dead_ends",
    description:
      "List files in the vault that have no outgoing links (dead ends).",
    schema: z.object({
      total: z.boolean().optional().describe("Return only the dead-end count"),
      all: z.boolean().optional().describe("Include non-markdown files"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianUnresolvedLinksTool = tool(
  async ({ total, counts, verbose, format, vault }) =>
    runObsidian("unresolved", { total, counts, verbose, format }, vault),
  {
    name: "obsidian_unresolved_links",
    description: "List unresolved (broken) links in the Obsidian vault.",
    schema: z.object({
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
  },
);

// ─── Tags ────────────────────────────────────────────────────────────────────

export const obsidianListTagsTool = tool(
  async ({ file, path, total, counts, sort, format, vault }) =>
    runObsidian("tags", { file, path, total, counts, sort, format }, vault),
  {
    name: "obsidian_list_tags",
    description:
      "List all tags in the Obsidian vault (or tags in a specific file).",
    schema: z.object({
      file: z
        .string()
        .optional()
        .describe("Filter tags to a specific file name"),
      path: z
        .string()
        .optional()
        .describe("Filter tags to a specific file path"),
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
  },
);

export const obsidianGetTagTool = tool(
  async ({ name, total, verbose, vault }) =>
    runObsidian("tag", { name, total, verbose }, vault),
  {
    name: "obsidian_get_tag",
    description: "Get info about a specific tag, including files that use it.",
    schema: z.object({
      name: z.string().describe("Tag name (required)"),
      total: z
        .boolean()
        .optional()
        .describe("Return only the occurrence count"),
      verbose: z.boolean().optional().describe("Include file list and count"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

// ─── Properties ──────────────────────────────────────────────────────────────

export const obsidianListPropertiesTool = tool(
  async ({ file, path, name, total, sort, counts, format, vault }) =>
    runObsidian(
      "properties",
      { file, path, name, total, sort, counts, format },
      vault,
    ),
  {
    name: "obsidian_list_properties",
    description:
      "List frontmatter properties in the vault or for a specific file.",
    schema: z.object({
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
  },
);

export const obsidianReadPropertyTool = tool(
  async ({ name, file, path, vault }) =>
    runObsidian("property:read", { name, file, path }, vault),
  {
    name: "obsidian_read_property",
    description:
      "Read the value of a specific frontmatter property from a file.",
    schema: z.object({
      name: z.string().describe("Property name (required)"),
      file: z.string().optional().describe("File name"),
      path: z.string().optional().describe("File path"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianSetPropertyTool = tool(
  async ({ name, value, type, file, path, vault }) =>
    runObsidian("property:set", { name, value, type, file, path }, vault),
  {
    name: "obsidian_set_property",
    description: "Set a frontmatter property on a file in the Obsidian vault.",
    schema: z.object({
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
  },
);

export const obsidianRemovePropertyTool = tool(
  async ({ name, file, path, vault }) =>
    runObsidian("property:remove", { name, file, path }, vault),
  {
    name: "obsidian_remove_property",
    description:
      "Remove a frontmatter property from a file in the Obsidian vault.",
    schema: z.object({
      name: z.string().describe("Property name (required)"),
      file: z.string().optional().describe("File name"),
      path: z.string().optional().describe("File path"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

// ─── Links & Aliases ─────────────────────────────────────────────────────────

export const obsidianGetLinksTool = tool(
  async ({ file, path, total, vault }) =>
    runObsidian("links", { file, path, total }, vault),
  {
    name: "obsidian_get_links",
    description: "List outgoing links from a file in the Obsidian vault.",
    schema: z.object({
      file: z.string().optional().describe("File name"),
      path: z.string().optional().describe("File path"),
      total: z.boolean().optional().describe("Return only the link count"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianGetBacklinksTool = tool(
  async ({ file, path, counts, total, format, vault }) =>
    runObsidian("backlinks", { file, path, counts, total, format }, vault),
  {
    name: "obsidian_get_backlinks",
    description:
      "List files that link to a given file (backlinks) in the Obsidian vault.",
    schema: z.object({
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
  },
);

export const obsidianListAliasesTool = tool(
  async ({ file, path, total, verbose, vault }) =>
    runObsidian("aliases", { file, path, total, verbose }, vault),
  {
    name: "obsidian_list_aliases",
    description: "List aliases defined in vault files.",
    schema: z.object({
      file: z.string().optional().describe("Filter by file name"),
      path: z.string().optional().describe("Filter by file path"),
      total: z.boolean().optional().describe("Return only the alias count"),
      verbose: z.boolean().optional().describe("Include file paths"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

// ─── Outline & Word Count ─────────────────────────────────────────────────────

export const obsidianOutlineTool = tool(
  async ({ file, path, format, total, vault }) =>
    runObsidian("outline", { file, path, format, total }, vault),
  {
    name: "obsidian_outline",
    description: "Show the heading outline of a file in the Obsidian vault.",
    schema: z.object({
      file: z.string().optional().describe("File name"),
      path: z.string().optional().describe("File path"),
      format: z
        .enum(["tree", "md", "json"])
        .optional()
        .describe("Output format (default: tree)"),
      total: z.boolean().optional().describe("Return only the heading count"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianWordCountTool = tool(
  async ({ file, path, words, characters, vault }) =>
    runObsidian("wordcount", { file, path, words, characters }, vault),
  {
    name: "obsidian_word_count",
    description: "Count words and characters in a file in the Obsidian vault.",
    schema: z.object({
      file: z.string().optional().describe("File name"),
      path: z.string().optional().describe("File path"),
      words: z.boolean().optional().describe("Return only the word count"),
      characters: z
        .boolean()
        .optional()
        .describe("Return only the character count"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

// ─── Daily Notes ─────────────────────────────────────────────────────────────

export const obsidianDailyNoteReadTool = tool(
  async ({ vault }) => runObsidian("daily:read", {}, vault),
  {
    name: "obsidian_daily_note_read",
    description: "Read the contents of today's daily note in Obsidian.",
    schema: z.object({
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianDailyNotePathTool = tool(
  async ({ vault }) => runObsidian("daily:path", {}, vault),
  {
    name: "obsidian_daily_note_path",
    description: "Get the file path of today's daily note in Obsidian.",
    schema: z.object({
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianOpenDailyNoteTool = tool(
  async ({ paneType, vault }) => runObsidian("daily", { paneType }, vault),
  {
    name: "obsidian_open_daily_note",
    description: "Open today's daily note in Obsidian.",
    schema: z.object({
      paneType: z
        .enum(["tab", "split", "window"])
        .optional()
        .describe("Where to open the note"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianDailyNoteAppendTool = tool(
  async ({ content, inline, open, paneType, vault }) =>
    runObsidian("daily:append", { content, inline, open, paneType }, vault),
  {
    name: "obsidian_daily_note_append",
    description: "Append content to today's daily note in Obsidian.",
    schema: z.object({
      content: z
        .string()
        .describe("Content to append (use \\n for newlines, \\t for tabs)"),
      inline: z
        .boolean()
        .optional()
        .describe("Append without a leading newline"),
      open: z.boolean().optional().describe("Open the note after appending"),
      paneType: z
        .enum(["tab", "split", "window"])
        .optional()
        .describe("Pane type when opening"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianDailyNotePrependTool = tool(
  async ({ content, inline, open, paneType, vault }) =>
    runObsidian("daily:prepend", { content, inline, open, paneType }, vault),
  {
    name: "obsidian_daily_note_prepend",
    description: "Prepend content to today's daily note in Obsidian.",
    schema: z.object({
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
  },
);

// ─── Tasks ───────────────────────────────────────────────────────────────────

export const obsidianListTasksTool = tool(
  async ({ file, path, total, done, todo, status, verbose, format, daily, vault }) =>
    runObsidian(
      "tasks",
      { file, path, total, done, todo, status, verbose, format, daily },
      vault,
    ),
  {
    name: "obsidian_list_tasks",
    description: "List tasks in the Obsidian vault with filtering options.",
    schema: z.object({
      file: z.string().optional().describe("Filter by file name"),
      path: z.string().optional().describe("Filter by file path"),
      total: z.boolean().optional().describe("Return only the task count"),
      done: z.boolean().optional().describe("Show only completed tasks"),
      todo: z.boolean().optional().describe("Show only incomplete tasks"),
      status: z.string().optional().describe("Filter by status character"),
      verbose: z
        .boolean()
        .optional()
        .describe("Group by file with line numbers"),
      format: z
        .enum(["json", "tsv", "csv", "text"])
        .optional()
        .describe("Output format (default: text)"),
      daily: z.boolean().optional().describe("Show tasks from daily note only"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianTaskActionTool = tool(
  async ({ ref, file, path, line, toggle, done, todo, status, daily, vault }) =>
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
  {
    name: "obsidian_task_action",
    description:
      "Show or update a specific task in the Obsidian vault (toggle, mark done/todo, or set a custom status).",
    schema: z.object({
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
  },
);

// ─── Bookmarks ───────────────────────────────────────────────────────────────

export const obsidianListBookmarksTool = tool(
  async ({ total, verbose, format, vault }) =>
    runObsidian("bookmarks", { total, verbose, format }, vault),
  {
    name: "obsidian_list_bookmarks",
    description: "List all bookmarks in the Obsidian vault.",
    schema: z.object({
      total: z.boolean().optional().describe("Return only the bookmark count"),
      verbose: z.boolean().optional().describe("Include bookmark types"),
      format: z
        .enum(["json", "tsv", "csv"])
        .optional()
        .describe("Output format (default: tsv)"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianAddBookmarkTool = tool(
  async ({ file, subpath, folder, search, url, title, vault }) =>
    runObsidian(
      "bookmark",
      { file, subpath, folder, search, url, title },
      vault,
    ),
  {
    name: "obsidian_add_bookmark",
    description: "Add a bookmark in the Obsidian vault.",
    schema: z.object({
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
  },
);

// ─── Templates ───────────────────────────────────────────────────────────────

export const obsidianListTemplatesTool = tool(
  async ({ total, vault }) => runObsidian("templates", { total }, vault),
  {
    name: "obsidian_list_templates",
    description: "List available templates in the Obsidian vault.",
    schema: z.object({
      total: z.boolean().optional().describe("Return only the template count"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianReadTemplateTool = tool(
  async ({ name, resolve, title, vault }) =>
    runObsidian("template:read", { name, resolve, title }, vault),
  {
    name: "obsidian_read_template",
    description: "Read the contents of an Obsidian template.",
    schema: z.object({
      name: z.string().describe("Template name (required)"),
      resolve: z.boolean().optional().describe("Resolve template variables"),
      title: z
        .string()
        .optional()
        .describe("Title to use when resolving variables"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianInsertTemplateTool = tool(
  async ({ name, vault }) => runObsidian("template:insert", { name }, vault),
  {
    name: "obsidian_insert_template",
    description:
      "Insert a template into the currently active file in Obsidian.",
    schema: z.object({
      name: z.string().describe("Template name (required)"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

// ─── Plugins ─────────────────────────────────────────────────────────────────

export const obsidianListPluginsTool = tool(
  async ({ filter, versions, format, enabledOnly, vault }) =>
    runObsidian(
      enabledOnly ? "plugins:enabled" : "plugins",
      { filter, versions, format },
      vault,
    ),
  {
    name: "obsidian_list_plugins",
    description: "List installed plugins in the Obsidian vault.",
    schema: z.object({
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
  },
);

export const obsidianGetPluginTool = tool(
  async ({ id, vault }) => runObsidian("plugin", { id }, vault),
  {
    name: "obsidian_get_plugin",
    description: "Get information about a specific Obsidian plugin.",
    schema: z.object({
      id: z.string().describe("Plugin ID (required)"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianEnablePluginTool = tool(
  async ({ id, filter, vault }) =>
    runObsidian("plugin:enable", { id, filter }, vault),
  {
    name: "obsidian_enable_plugin",
    description: "Enable an installed plugin in Obsidian.",
    schema: z.object({
      id: z.string().describe("Plugin ID (required)"),
      filter: z.enum(["core", "community"]).optional().describe("Plugin type"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianDisablePluginTool = tool(
  async ({ id, filter, vault }) =>
    runObsidian("plugin:disable", { id, filter }, vault),
  {
    name: "obsidian_disable_plugin",
    description: "Disable an installed plugin in Obsidian.",
    schema: z.object({
      id: z.string().describe("Plugin ID (required)"),
      filter: z.enum(["core", "community"]).optional().describe("Plugin type"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianInstallPluginTool = tool(
  async ({ id, enable, vault }) =>
    runObsidian("plugin:install", { id, enable }, vault),
  {
    name: "obsidian_install_plugin",
    description: "Install a community plugin in Obsidian.",
    schema: z.object({
      id: z.string().describe("Plugin ID (required)"),
      enable: z
        .boolean()
        .optional()
        .describe("Enable the plugin after installing"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianUninstallPluginTool = tool(
  async ({ id, vault }) => runObsidian("plugin:uninstall", { id }, vault),
  {
    name: "obsidian_uninstall_plugin",
    description: "Uninstall a community plugin from Obsidian.",
    schema: z.object({
      id: z.string().describe("Plugin ID (required)"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianReloadPluginTool = tool(
  async ({ id, vault }) => runObsidian("plugin:reload", { id }, vault),
  {
    name: "obsidian_reload_plugin",
    description:
      "Reload a plugin in Obsidian (useful during plugin development).",
    schema: z.object({
      id: z.string().describe("Plugin ID (required)"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

// ─── Themes ───────────────────────────────────────────────────────────────────

export const obsidianListThemesTool = tool(
  async ({ versions, vault }) => runObsidian("themes", { versions }, vault),
  {
    name: "obsidian_list_themes",
    description: "List installed themes in Obsidian.",
    schema: z.object({
      versions: z.boolean().optional().describe("Include version numbers"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianGetThemeTool = tool(
  async ({ name, vault }) => runObsidian("theme", { name }, vault),
  {
    name: "obsidian_get_theme",
    description:
      "Show the active theme or get info about a specific installed theme.",
    schema: z.object({
      name: z.string().optional().describe("Theme name for details"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianSetThemeTool = tool(
  async ({ name, vault }) => runObsidian("theme:set", { name }, vault),
  {
    name: "obsidian_set_theme",
    description:
      "Set the active theme in Obsidian (pass empty string to restore default).",
    schema: z.object({
      name: z.string().describe("Theme name (pass empty string for default)"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianInstallThemeTool = tool(
  async ({ name, enable, vault }) =>
    runObsidian("theme:install", { name, enable }, vault),
  {
    name: "obsidian_install_theme",
    description: "Install a community theme in Obsidian.",
    schema: z.object({
      name: z.string().describe("Theme name (required)"),
      enable: z
        .boolean()
        .optional()
        .describe("Activate the theme after installing"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianUninstallThemeTool = tool(
  async ({ name, vault }) => runObsidian("theme:uninstall", { name }, vault),
  {
    name: "obsidian_uninstall_theme",
    description: "Uninstall a theme from Obsidian.",
    schema: z.object({
      name: z.string().describe("Theme name (required)"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

// ─── CSS Snippets ─────────────────────────────────────────────────────────────

export const obsidianListSnippetsTool = tool(
  async ({ enabledOnly, vault }) =>
    runObsidian(enabledOnly ? "snippets:enabled" : "snippets", {}, vault),
  {
    name: "obsidian_list_snippets",
    description: "List installed CSS snippets in Obsidian.",
    schema: z.object({
      enabledOnly: z
        .boolean()
        .optional()
        .describe("List only enabled snippets"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianToggleSnippetTool = tool(
  async ({ name, action, vault }) =>
    runObsidian(`snippet:${action}`, { name }, vault),
  {
    name: "obsidian_toggle_snippet",
    description: "Enable or disable a CSS snippet in Obsidian.",
    schema: z.object({
      name: z.string().describe("Snippet name (required)"),
      action: z
        .enum(["enable", "disable"])
        .describe("Whether to enable or disable the snippet"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

// ─── Sync ────────────────────────────────────────────────────────────────────

export const obsidianSyncControlTool = tool(
  async ({ action, vault }) =>
    runObsidian("sync", { [action]: true }, vault),
  {
    name: "obsidian_sync_control",
    description: "Pause or resume Obsidian Sync.",
    schema: z.object({
      action: z
        .enum(["on", "off"])
        .describe("on = resume sync, off = pause sync"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianSyncStatusTool = tool(
  async ({ vault }) => runObsidian("sync:status", {}, vault),
  {
    name: "obsidian_sync_status",
    description: "Show the current Obsidian Sync status.",
    schema: z.object({
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianSyncHistoryTool = tool(
  async ({ file, path, total, vault }) =>
    runObsidian("sync:history", { file, path, total }, vault),
  {
    name: "obsidian_sync_history",
    description: "List sync version history for a file in Obsidian Sync.",
    schema: z.object({
      file: z.string().optional().describe("File name"),
      path: z.string().optional().describe("File path"),
      total: z.boolean().optional().describe("Return only the version count"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianSyncDeletedTool = tool(
  async ({ total, vault }) => runObsidian("sync:deleted", { total }, vault),
  {
    name: "obsidian_sync_deleted",
    description: "List deleted files tracked by Obsidian Sync.",
    schema: z.object({
      total: z
        .boolean()
        .optional()
        .describe("Return only the deleted file count"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianSyncReadVersionTool = tool(
  async ({ version, file, path, vault }) =>
    runObsidian(
      "sync:read",
      { version: version.toString(), file, path },
      vault,
    ),
  {
    name: "obsidian_sync_read_version",
    description: "Read a specific sync version of a file from Obsidian Sync.",
    schema: z.object({
      version: z.number().describe("Version number (required)"),
      file: z.string().optional().describe("File name"),
      path: z.string().optional().describe("File path"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianSyncRestoreVersionTool = tool(
  async ({ version, file, path, vault }) =>
    runObsidian(
      "sync:restore",
      { version: version.toString(), file, path },
      vault,
    ),
  {
    name: "obsidian_sync_restore_version",
    description: "Restore a file to a specific sync version in Obsidian Sync.",
    schema: z.object({
      version: z.number().describe("Version number (required)"),
      file: z.string().optional().describe("File name"),
      path: z.string().optional().describe("File path"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

// ─── File History (Local Recovery) ───────────────────────────────────────────

export const obsidianHistoryListTool = tool(
  async ({ file, path, vault }) =>
    runObsidian("history", { file, path }, vault),
  {
    name: "obsidian_history_list",
    description: "List local version history for a file in Obsidian.",
    schema: z.object({
      file: z.string().optional().describe("File name"),
      path: z.string().optional().describe("File path"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianHistoryReadTool = tool(
  async ({ version, file, path, vault }) =>
    runObsidian(
      "history:read",
      { version: version?.toString(), file, path },
      vault,
    ),
  {
    name: "obsidian_history_read",
    description:
      "Read a specific local history version of a file in Obsidian.",
    schema: z.object({
      version: z.number().optional().describe("Version number (default: 1)"),
      file: z.string().optional().describe("File name"),
      path: z.string().optional().describe("File path"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianHistoryRestoreTool = tool(
  async ({ version, file, path, vault }) =>
    runObsidian(
      "history:restore",
      { version: version.toString(), file, path },
      vault,
    ),
  {
    name: "obsidian_history_restore",
    description:
      "Restore a file to a specific local history version in Obsidian.",
    schema: z.object({
      version: z.number().describe("Version number (required)"),
      file: z.string().optional().describe("File name"),
      path: z.string().optional().describe("File path"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

// ─── Bases ───────────────────────────────────────────────────────────────────

export const obsidianListBasesTool = tool(
  async ({ vault }) => runObsidian("bases", {}, vault),
  {
    name: "obsidian_list_bases",
    description: "List all base files (Obsidian Bases) in the vault.",
    schema: z.object({
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianQueryBaseTool = tool(
  async ({ file, path, view, format, vault }) =>
    runObsidian("base:query", { file, path, view, format }, vault),
  {
    name: "obsidian_query_base",
    description: "Query an Obsidian Base and return results.",
    schema: z.object({
      file: z.string().optional().describe("Base file name"),
      path: z.string().optional().describe("Base file path"),
      view: z.string().optional().describe("View name to query"),
      format: z
        .enum(["json", "csv", "tsv", "md", "paths"])
        .optional()
        .describe("Output format (default: json)"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianCreateBaseItemTool = tool(
  async ({ file, path, view, name, content, open, vault }) =>
    runObsidian(
      "base:create",
      { file, path, view, name, content, open },
      vault,
    ),
  {
    name: "obsidian_create_base_item",
    description: "Create a new item in an Obsidian Base.",
    schema: z.object({
      file: z.string().optional().describe("Base file name"),
      path: z.string().optional().describe("Base file path"),
      view: z.string().optional().describe("View name"),
      name: z.string().optional().describe("New item file name"),
      content: z.string().optional().describe("Initial content"),
      open: z.boolean().optional().describe("Open file after creating"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianBaseViewsTool = tool(
  async ({ vault }) => runObsidian("base:views", {}, vault),
  {
    name: "obsidian_base_views",
    description: "List views in the current Obsidian Base file.",
    schema: z.object({
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

// ─── Commands & Hotkeys ───────────────────────────────────────────────────────

export const obsidianListCommandsTool = tool(
  async ({ filter, vault }) => runObsidian("commands", { filter }, vault),
  {
    name: "obsidian_list_commands",
    description:
      "List all available commands in the Obsidian command palette.",
    schema: z.object({
      filter: z.string().optional().describe("Filter commands by ID prefix"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianExecuteCommandTool = tool(
  async ({ id, vault }) => runObsidian("command", { id }, vault),
  {
    name: "obsidian_execute_command",
    description: "Execute an Obsidian command by its command ID.",
    schema: z.object({
      id: z.string().describe("Command ID to execute (required)"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianListHotkeysTool = tool(
  async ({ total, verbose, all, format, vault }) =>
    runObsidian("hotkeys", { total, verbose, all, format }, vault),
  {
    name: "obsidian_list_hotkeys",
    description: "List hotkeys configured in Obsidian.",
    schema: z.object({
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
  },
);

export const obsidianGetHotkeyTool = tool(
  async ({ id, verbose, vault }) =>
    runObsidian("hotkey", { id, verbose }, vault),
  {
    name: "obsidian_get_hotkey",
    description: "Get the hotkey configured for a specific Obsidian command.",
    schema: z.object({
      id: z.string().describe("Command ID (required)"),
      verbose: z
        .boolean()
        .optional()
        .describe("Show whether it is custom or default"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

// ─── Utility ─────────────────────────────────────────────────────────────────

export const obsidianVersionTool = tool(
  async () => runObsidian("version"),
  {
    name: "obsidian_version",
    description: "Show the current Obsidian version.",
    schema: z.object({}),
  },
);

export const obsidianRandomReadTool = tool(
  async ({ folder, vault }) => runObsidian("random:read", { folder }, vault),
  {
    name: "obsidian_random_read",
    description: "Read a random note from the Obsidian vault.",
    schema: z.object({
      folder: z.string().optional().describe("Limit to a specific folder"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianRecentFilesTool = tool(
  async ({ total, vault }) => runObsidian("recents", { total }, vault),
  {
    name: "obsidian_recent_files",
    description: "List recently opened files in Obsidian.",
    schema: z.object({
      total: z.boolean().optional().describe("Return only the count"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianWorkspaceTool = tool(
  async ({ ids, vault }) => runObsidian("workspace", { ids }, vault),
  {
    name: "obsidian_workspace",
    description: "Show the current Obsidian workspace layout tree.",
    schema: z.object({
      ids: z.boolean().optional().describe("Include workspace item IDs"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianListTabsTool = tool(
  async ({ ids, vault }) => runObsidian("tabs", { ids }, vault),
  {
    name: "obsidian_list_tabs",
    description: "List currently open tabs in Obsidian.",
    schema: z.object({
      ids: z.boolean().optional().describe("Include tab IDs"),
      vault: z.string().optional().describe("Target vault name"),
    }),
  },
);

export const obsidianDiffTool = tool(
  async ({ file, path, from, to, filter, vault }) =>
    runObsidian(
      "diff",
      { file, path, from: from?.toString(), to: to?.toString(), filter },
      vault,
    ),
  {
    name: "obsidian_diff",
    description: "List or diff local vs sync versions of a file in Obsidian.",
    schema: z.object({
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
  },
);

// ─── Export ───────────────────────────────────────────────────────────────────

export const obsidianTools = [
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
];
