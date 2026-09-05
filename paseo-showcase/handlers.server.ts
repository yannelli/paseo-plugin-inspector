import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import type { PluginHandlerContext } from "@getpaseo/plugin/server";
import type { input as ZodInput, output as ZodOutput } from "zod";
import {
  type Note,
  addNote,
  agentSummary,
  daemonOverview,
  failOnPurpose,
  gitLog,
  listNotes,
  removeNote,
  searchNotes,
  serverCleanups,
  systemInfo,
} from "./contracts.shared";

const execFileAsync = promisify(execFile);

const serverStartedAt = new Date().toISOString();
let heartbeats = 0;
const heartbeat = setInterval(() => {
  heartbeats += 1;
  console.log(`[showcase] heartbeat ${heartbeats}`);
}, 60_000);
heartbeat.unref();
serverCleanups.add(() => {
  clearInterval(heartbeat);
  console.log("[showcase] heartbeat stopped, cleanup ran");
});
console.log(`[showcase] server module loaded on ${os.hostname()} (pid ${process.pid})`);

export function getSystemInfo(): ZodInput<typeof systemInfo.output> {
  const mb = (bytes: number) => Math.round(bytes / 1024 / 1024);
  return {
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    nodeVersion: process.version,
    pid: process.pid,
    uptimeSeconds: Math.round(os.uptime()),
    cpuCount: os.cpus().length,
    totalMemoryMb: mb(os.totalmem()),
    freeMemoryMb: mb(os.freemem()),
    loadAverage: os.loadavg().map((value) => Math.round(value * 100) / 100),
    serverStartedAt,
    heartbeats,
  };
}

export async function getDaemonOverview(
  _input: ZodOutput<typeof daemonOverview.input>,
  { paseo }: PluginHandlerContext,
): Promise<ZodInput<typeof daemonOverview.output>> {
  const [projects, workspaces, agents, providers, config] = await Promise.all([
    paseo.projects.list(),
    paseo.workspaces.list(),
    paseo.agents.list(),
    paseo.providers.snapshot(),
    paseo.config.get(),
  ]);
  return {
    projectCount: projects.projects.length,
    workspaceCount: workspaces.entries.length,
    agentCount: agents.entries.length,
    mcpInjectIntoAgents: config.config.mcp.injectIntoAgents,
    browserToolsEnabled: config.config.browserTools.enabled,
    providers: providers.entries.map((entry) => ({
      provider: entry.provider,
      status: entry.status,
      enabled: entry.enabled,
      modelCount: entry.models?.length ?? 0,
      error: entry.error ?? null,
    })),
  };
}

export async function getGitLog({
  directory,
  limit,
}: ZodOutput<typeof gitLog.input>): Promise<ZodInput<typeof gitLog.output>> {
  try {
    const [branch, log] = await Promise.all([
      execFileAsync("git", ["-C", directory, "rev-parse", "--abbrev-ref", "HEAD"]),
      execFileAsync("git", [
        "-C",
        directory,
        "log",
        `-n${limit}`,
        "--pretty=format:%H%x1f%h%x1f%s%x1f%an%x1f%cr",
      ]),
    ]);
    const commits = log.stdout
      .split("\n")
      .filter((line) => line.length > 0)
      .map((line) => {
        const [hash = "", shortHash = "", subject = "", author = "", relativeDate = ""] =
          line.split("\x1f");
        return { hash, shortHash, subject, author, relativeDate };
      });
    return { branch: branch.stdout.trim(), commits, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[showcase] git log failed", message);
    return { branch: null, commits: [], error: message.split("\n")[0] ?? message };
  }
}

export async function getAgentSummary(
  { agentId }: ZodOutput<typeof agentSummary.input>,
  { paseo }: PluginHandlerContext,
): Promise<ZodInput<typeof agentSummary.output>> {
  const page = await paseo.agents.ref(agentId).timeline.refetch({ limit: 500 });
  const summary = {
    entryCount: page.entries.length,
    userMessages: 0,
    assistantMessages: 0,
    reasoningBlocks: 0,
    toolCalls: 0,
    failedToolCalls: 0,
    lastToolName: null as string | null,
    error: page.error,
  };
  for (const entry of page.entries) {
    const item = entry.item;
    switch (item.type) {
      case "user_message":
        summary.userMessages += 1;
        break;
      case "assistant_message":
        summary.assistantMessages += 1;
        break;
      case "reasoning":
        summary.reasoningBlocks += 1;
        break;
      case "tool_call":
        summary.toolCalls += 1;
        summary.lastToolName = item.name;
        if (item.status === "failed") summary.failedToolCalls += 1;
        break;
      default:
        break;
    }
  }
  return summary;
}

const notesDir = path.join(os.homedir(), ".paseo-showcase");
const notesFile = path.join(notesDir, "notes.json");
let notesCache: Note[] | null = null;

async function loadNotes(): Promise<Note[]> {
  if (notesCache) return notesCache;
  try {
    const raw = await readFile(notesFile, "utf8");
    const parsed: unknown = JSON.parse(raw);
    notesCache = Array.isArray(parsed) ? (parsed as Note[]) : [];
  } catch {
    notesCache = [];
  }
  return notesCache;
}

async function saveNotes(notes: Note[]): Promise<void> {
  notesCache = notes;
  await mkdir(notesDir, { recursive: true });
  await writeFile(notesFile, JSON.stringify(notes, null, 2), "utf8");
}

export async function handleListNotes(): Promise<ZodInput<typeof listNotes.output>> {
  return { notes: await loadNotes(), file: notesFile };
}

export async function handleAddNote({
  title,
  body,
}: ZodOutput<typeof addNote.input>): Promise<ZodInput<typeof addNote.output>> {
  const note: Note = { id: randomUUID(), title, body, createdAt: new Date().toISOString() };
  await saveNotes([note, ...(await loadNotes())]);
  console.log(`[showcase] note added: ${note.title}`);
  return note;
}

export async function handleRemoveNote({
  id,
}: ZodOutput<typeof removeNote.input>): Promise<ZodInput<typeof removeNote.output>> {
  const notes = await loadNotes();
  const remaining = notes.filter((note) => note.id !== id);
  if (remaining.length === notes.length) return { removed: false };
  await saveNotes(remaining);
  return { removed: true };
}

export async function handleSearchNotes({
  query,
}: ZodOutput<typeof searchNotes.input>): Promise<ZodInput<typeof searchNotes.output>> {
  const needle = query.trim().toLowerCase();
  const notes = await loadNotes();
  const matches = needle
    ? notes.filter(
        (note) =>
          note.title.toLowerCase().includes(needle) || note.body.toLowerCase().includes(needle),
      )
    : notes;
  const fileUrl = pathToFileURL(notesFile).href;
  return {
    items: matches.slice(0, 25).map((note) => ({
      id: note.id,
      identifier: `NOTE-${note.id.slice(0, 8)}`,
      title: note.title,
      subtitle: `Saved ${new Date(note.createdAt).toLocaleString()}`,
      url: `${fileUrl}#${note.id}`,
      text: `Showcase note "${note.title}" (created ${note.createdAt})\n\n${note.body}`,
      resourceType: "showcase-note",
    })),
  };
}

export function handleFailOnPurpose({
  mode,
}: ZodOutput<typeof failOnPurpose.input>): ZodInput<typeof failOnPurpose.output> {
  if (mode === "throw") {
    console.error("[showcase] handler threw on purpose");
    throw new Error("Showcase handler threw on purpose");
  }
  if (mode === "bad-output") {
    return { ok: "not-a-boolean" } as unknown as ZodInput<typeof failOnPurpose.output>;
  }
  return { ok: true };
}
