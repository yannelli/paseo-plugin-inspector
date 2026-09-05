import {
  PluginAttachmentSearchPayloadSchema,
  defineAttachmentSource,
  defineRpc,
} from "@getpaseo/plugin/server";
import { z } from "zod";

export const systemInfo = defineRpc({
  name: "showcase.system-info",
  input: z.object({}),
  output: z.object({
    hostname: z.string(),
    platform: z.string(),
    arch: z.string(),
    nodeVersion: z.string(),
    pid: z.number(),
    uptimeSeconds: z.number(),
    cpuCount: z.number(),
    totalMemoryMb: z.number(),
    freeMemoryMb: z.number(),
    loadAverage: z.array(z.number()),
    serverStartedAt: z.string(),
    heartbeats: z.number(),
  }),
});

export const daemonOverview = defineRpc({
  name: "showcase.daemon-overview",
  input: z.object({}),
  output: z.object({
    projectCount: z.number(),
    workspaceCount: z.number(),
    agentCount: z.number(),
    mcpInjectIntoAgents: z.boolean(),
    browserToolsEnabled: z.boolean(),
    providers: z.array(
      z.object({
        provider: z.string(),
        status: z.string(),
        enabled: z.boolean(),
        modelCount: z.number(),
        error: z.string().nullable(),
      }),
    ),
  }),
});

export const gitLog = defineRpc({
  name: "showcase.git-log",
  input: z.object({
    directory: z.string(),
    limit: z.number().int().min(1).max(50).default(10),
  }),
  output: z.object({
    branch: z.string().nullable(),
    commits: z.array(
      z.object({
        hash: z.string(),
        shortHash: z.string(),
        subject: z.string(),
        author: z.string(),
        relativeDate: z.string(),
      }),
    ),
    error: z.string().nullable(),
  }),
});

export const agentSummary = defineRpc({
  name: "showcase.agent-summary",
  input: z.object({ agentId: z.string() }),
  output: z.object({
    entryCount: z.number(),
    userMessages: z.number(),
    assistantMessages: z.number(),
    reasoningBlocks: z.number(),
    toolCalls: z.number(),
    failedToolCalls: z.number(),
    lastToolName: z.string().nullable(),
    error: z.string().nullable(),
  }),
});

export const NoteSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  createdAt: z.string(),
});
export type Note = z.infer<typeof NoteSchema>;

export const listNotes = defineRpc({
  name: "showcase.notes.list",
  input: z.object({}),
  output: z.object({ notes: z.array(NoteSchema), file: z.string() }),
});

export const addNote = defineRpc({
  name: "showcase.notes.add",
  input: z.object({ title: z.string().trim().min(1).max(120), body: z.string().max(4000) }),
  output: NoteSchema,
});

export const removeNote = defineRpc({
  name: "showcase.notes.remove",
  input: z.object({ id: z.string() }),
  output: z.object({ removed: z.boolean() }),
});

export const searchNotes = defineRpc({
  name: "showcase.notes.search",
  input: z.object({ query: z.string() }),
  output: PluginAttachmentSearchPayloadSchema,
});

export const notesAttachmentSource = defineAttachmentSource({
  id: "notes",
  title: "Showcase note",
  icon: "StickyNote",
  pickerTitle: "Attach a showcase note",
  searchPlaceholder: "Search notes by title or body",
  search: searchNotes,
});

export const failOnPurpose = defineRpc({
  name: "showcase.fail",
  input: z.object({ mode: z.enum(["throw", "bad-output", "bad-input"]) }),
  output: z.object({ ok: z.literal(true) }),
});

export const TOOL_CARD_KIND = "showcase-tool-card";
export const TOOL_CARD_VERSION = 1;
export const ToolCardSchema = z.object({
  tool: z.string(),
  status: z.string(),
  callId: z.string(),
  summary: z.string().nullable(),
});
export type ToolCard = z.infer<typeof ToolCardSchema>;

export const SURFACE_DASHBOARD = "dashboard";
export const PANEL_WORKSPACE = "workspace-inspector";
export const PANEL_AGENT = "agent-inspector";

/** Server modules register teardown here; the client bundle sees an empty set. */
export const serverCleanups = new Set<() => void | Promise<void>>();
