import type { PluginContext } from "@getpaseo/plugin";
import { AgentInspector } from "./agent-panel.client";
import {
  PANEL_AGENT,
  PANEL_WORKSPACE,
  SURFACE_DASHBOARD,
  TOOL_CARD_KIND,
  TOOL_CARD_VERSION,
  ToolCardSchema,
  addNote,
  agentSummary,
  daemonOverview,
  failOnPurpose,
  gitLog,
  listNotes,
  notesAttachmentSource,
  removeNote,
  searchNotes,
  serverCleanups,
  systemInfo,
} from "./contracts.shared";
import { Dashboard } from "./dashboard.client";
import {
  getAgentSummary,
  getDaemonOverview,
  getGitLog,
  getSystemInfo,
  handleAddNote,
  handleFailOnPurpose,
  handleListNotes,
  handleRemoveNote,
  handleSearchNotes,
} from "./handlers.server";
import { contributeClient } from "./pills.client";
import { PaseoToolCard, paseoToolTransformer } from "./timeline.client";
import { WorkspaceInspector } from "./workspace-panel.client";

export default function contribute(plugin: PluginContext) {
  // Daemon-side RPC handlers (stripped from the client bundle).
  plugin.handle(systemInfo, getSystemInfo);
  plugin.handle(daemonOverview, getDaemonOverview);
  plugin.handle(gitLog, getGitLog);
  plugin.handle(agentSummary, getAgentSummary);
  plugin.handle(listNotes, handleListNotes);
  plugin.handle(addNote, handleAddNote);
  plugin.handle(removeNote, handleRemoveNote);
  plugin.handle(searchNotes, handleSearchNotes);
  plugin.handle(failOnPurpose, handleFailOnPurpose);

  // Sidebar surface.
  plugin.addSurface(SURFACE_DASHBOARD, Dashboard);
  plugin.addSidebarItem({
    id: SURFACE_DASHBOARD,
    title: "Showcase",
    icon: "Sparkles",
    surface: SURFACE_DASHBOARD,
  });

  // Workspace and agent panels.
  plugin.addWorkspacePanel({
    id: PANEL_WORKSPACE,
    title: "Workspace inspector",
    icon: "FolderGit2",
    context: "workspace",
    locations: ["workspace", "explorer"],
    Component: WorkspaceInspector,
  });
  plugin.addWorkspacePanel({
    id: PANEL_AGENT,
    title: "Agent inspector",
    icon: "Bot",
    context: "agent",
    Component: AgentInspector,
  });

  // Command Center items, one per context.
  plugin.addCommandCenterItem({
    id: "open-dashboard",
    title: "Showcase: open dashboard",
    icon: "Sparkles",
    keywords: ["plugin", "demo", "showcase"],
    context: "global",
    onSelect({ openSurface }) {
      openSurface(SURFACE_DASHBOARD);
    },
  });
  plugin.addCommandCenterItem({
    id: "inspect-workspace",
    title: "Showcase: inspect workspace",
    icon: "FolderGit2",
    keywords: ["workspace", "git", "showcase"],
    context: "workspace",
    async onSelect({ paseo, workspace, openPanel }) {
      await paseo.workspaces.ref(workspace.id).refresh();
      openPanel(PANEL_WORKSPACE);
    },
  });
  plugin.addCommandCenterItem({
    id: "inspect-workspace-explorer",
    title: "Showcase: inspect workspace in Explorer",
    icon: "PanelRight",
    keywords: ["explorer", "showcase"],
    context: "workspace",
    onSelect({ openPanel }) {
      openPanel(PANEL_WORKSPACE, { location: "explorer" });
    },
  });
  plugin.addCommandCenterItem({
    id: "inspect-agent",
    title: "Showcase: inspect agent",
    icon: "Bot",
    keywords: ["agent", "timeline", "showcase"],
    context: "agent",
    async onSelect({ rpc, agent, openPanel }) {
      await rpc(agentSummary, { agentId: agent.id });
      openPanel(PANEL_AGENT);
    },
  });

  // Composer pills through the headless client entrypoint.
  plugin.addClientSide(contributeClient);

  // Composer attachment source backed by the notes RPC.
  plugin.addAttachmentSource(notesAttachmentSource);

  // Themes.
  plugin.addTheme({
    id: "showcase-dusk",
    name: "Showcase Dusk",
    appearance: "dark",
    colors: {
      background: "#141821",
      foreground: "#e6e9f0",
      raised: "#1d2330",
      control: "#283042",
      border: "#343d52",
      accent: "#7aa2f7",
      mutedForeground: "#9aa3b8",
      ring: "#4b5570",
    },
  });
  plugin.addTheme({
    id: "showcase-dawn",
    name: "Showcase Dawn",
    appearance: "light",
    colors: {
      background: "#fbf7f0",
      foreground: "#2b2622",
      raised: "#f3ede3",
      control: "#e9e1d3",
      border: "#d9cfbd",
      accent: "#c2410c",
      mutedForeground: "#6b6259",
      ring: "#b8ad9a",
    },
  });

  // Timeline transformer and renderer for Paseo MCP tool calls.
  plugin.addTimelineTransformer(paseoToolTransformer);
  plugin.addTimelineRenderer({
    kind: TOOL_CARD_KIND,
    version: TOOL_CARD_VERSION,
    schema: ToolCardSchema,
    Component: PaseoToolCard,
  });

  return async () => {
    for (const cleanup of serverCleanups) {
      await cleanup();
    }
    serverCleanups.clear();
  };
}
