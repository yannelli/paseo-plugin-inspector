import { type PluginSurfaceProps, type PluginTheme, usePaseo, useRpc } from "@getpaseo/plugin";
import { Icon, Modal, useToast } from "@getpaseo/plugin/react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import {
  addNote,
  daemonOverview,
  failOnPurpose,
  listNotes,
  removeNote,
  systemInfo,
} from "./contracts.shared";
import { Badge, Button, ButtonRow, Card, KeyValue, ListRow, Muted, statusColor } from "./ui.client";

type SectionProps = Pick<PluginSurfaceProps, "theme" | "layout" | "host" | "navigation">;

const THEME_TOKENS: Array<keyof PluginTheme["colors"]> = [
  "surface0",
  "surface1",
  "surface2",
  "border",
  "foreground",
  "foregroundMuted",
  "accent",
  "accentForeground",
  "statusSuccess",
  "statusWarning",
  "statusDanger",
];

export function Dashboard(props: PluginSurfaceProps) {
  const { theme, layout } = props;
  const compact = layout.compact;
  const styles = useMemo(
    () => ({
      screen: { flex: 1, backgroundColor: theme.colors.surface0 },
      content: { padding: compact ? 12 : 24, gap: compact ? 12 : 16, maxWidth: 960, width: "100%" as const, alignSelf: "center" as const },
      title: { color: theme.colors.foreground, fontSize: compact ? 22 : 28, fontWeight: "700" as const },
      subtitle: { color: theme.colors.foregroundMuted, fontSize: 14 },
    }),
    [theme, compact],
  );
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={{ gap: 4 }}>
        <Text style={styles.title}>Paseo plugin showcase</Text>
        <Text style={styles.subtitle}>
          Every section below exercises one part of the plugin SDK. Open Command Center and search
          “showcase” for the command items, type “/” in a composer for the attachment source, and
          open a workspace or agent tab for the panels.
        </Text>
      </View>
      <HostSection {...props} />
      <ThemeSection {...props} />
      <SystemSection {...props} />
      <DaemonOverviewSection {...props} />
      <LiveSdkSection {...props} />
      <NotesSection {...props} />
      <ErrorSection {...props} />
      <AboutSection {...props} />
    </ScrollView>
  );
}

function HostSection({ theme, layout, host, navigation }: SectionProps) {
  return (
    <Card theme={theme} compact={layout.compact} title="Host and layout props" icon="MonitorSmartphone">
      <KeyValue theme={theme} label="host.id" value={host.id} mono />
      <KeyValue theme={theme} label="host.label" value={host.label} />
      <KeyValue theme={theme} label="layout.platform" value={layout.platform} />
      <KeyValue theme={theme} label="layout.compact" value={layout.compact} />
      <KeyValue theme={theme} label="navigation available" value={Boolean(navigation)} />
    </Card>
  );
}

function ThemeSection({ theme, layout }: SectionProps) {
  return (
    <Card theme={theme} compact={layout.compact} title="Theme tokens" icon="Palette">
      <Muted theme={theme}>Switch the Paseo theme and these swatches follow it.</Muted>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {THEME_TOKENS.map((token) => (
          <View key={token} style={{ alignItems: "center", gap: 4, width: layout.compact ? 88 : 104 }}>
            <View
              style={{
                width: "100%",
                height: 32,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors[token],
              }}
            />
            <Text style={{ color: theme.colors.foregroundMuted, fontSize: 11 }}>{token}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

function SystemSection({ theme, layout }: SectionProps) {
  const fetchSystemInfo = useRpc(systemInfo);
  const query = useQuery({
    queryKey: ["showcase", "system-info"],
    queryFn: () => fetchSystemInfo({}),
    refetchInterval: 15_000,
  });
  const info = query.data;
  return (
    <Card theme={theme} compact={layout.compact} title="Daemon machine (RPC + useQuery)" icon="Server">
      <Muted theme={theme}>
        The client calls a Zod-validated RPC; the handler reads Node APIs inside the plugin
        subprocess.
      </Muted>
      {query.isError ? (
        <Text style={{ color: theme.colors.statusDanger }}>{String(query.error)}</Text>
      ) : null}
      {info ? (
        <>
          <KeyValue theme={theme} label="hostname" value={info.hostname} mono />
          <KeyValue theme={theme} label="platform / arch" value={`${info.platform} / ${info.arch}`} />
          <KeyValue theme={theme} label="node" value={info.nodeVersion} mono />
          <KeyValue theme={theme} label="plugin pid" value={info.pid} mono />
          <KeyValue theme={theme} label="cpus" value={info.cpuCount} />
          <KeyValue theme={theme} label="memory free / total" value={`${info.freeMemoryMb} / ${info.totalMemoryMb} MB`} />
          <KeyValue theme={theme} label="load average" value={info.loadAverage.join(", ")} mono />
          <KeyValue theme={theme} label="uptime" value={`${Math.round(info.uptimeSeconds / 3600)} h`} />
          <KeyValue theme={theme} label="server started" value={info.serverStartedAt} mono />
          <KeyValue theme={theme} label="heartbeats logged" value={info.heartbeats} />
        </>
      ) : (
        <Muted theme={theme}>{query.isLoading ? "Loading…" : "No data"}</Muted>
      )}
      <ButtonRow>
        <Button theme={theme} label="Refresh" icon="RefreshCw" variant="secondary" onPress={() => void query.refetch()} />
      </ButtonRow>
    </Card>
  );
}

function DaemonOverviewSection({ theme, layout }: SectionProps) {
  const fetchOverview = useRpc(daemonOverview);
  const query = useQuery({
    queryKey: ["showcase", "daemon-overview"],
    queryFn: () => fetchOverview({}),
  });
  const data = query.data;
  return (
    <Card theme={theme} compact={layout.compact} title="Daemon overview (server-side PaseoApi)" icon="Database">
      <Muted theme={theme}>
        The handler receives the same PaseoApi as the client and aggregates projects, workspaces,
        agents, providers, and config on the daemon.
      </Muted>
      {query.isError ? (
        <Text style={{ color: theme.colors.statusDanger }}>{String(query.error)}</Text>
      ) : null}
      {data ? (
        <>
          <KeyValue theme={theme} label="projects" value={data.projectCount} />
          <KeyValue theme={theme} label="workspaces" value={data.workspaceCount} />
          <KeyValue theme={theme} label="agents" value={data.agentCount} />
          <KeyValue theme={theme} label="mcp.injectIntoAgents" value={data.mcpInjectIntoAgents} />
          <KeyValue theme={theme} label="browserTools.enabled" value={data.browserToolsEnabled} />
          <View style={{ gap: 4 }}>
            {data.providers.map((provider) => (
              <View key={provider.provider} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={{ color: theme.colors.foreground, fontSize: 13, flex: 1 }}>{provider.provider}</Text>
                <Muted theme={theme}>{provider.modelCount} models</Muted>
                <Badge theme={theme} label={provider.enabled ? provider.status : "disabled"} />
              </View>
            ))}
          </View>
        </>
      ) : (
        <Muted theme={theme}>{query.isLoading ? "Loading…" : "No data"}</Muted>
      )}
      <ButtonRow>
        <Button theme={theme} label="Refresh" icon="RefreshCw" variant="secondary" onPress={() => void query.refetch()} />
      </ButtonRow>
    </Card>
  );
}

function LiveSdkSection({ theme, layout, navigation }: SectionProps) {
  const paseo = usePaseo();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [events, setEvents] = useState({ workspace: 0, agent: 0, last: "none yet" });

  const workspaces = useQuery({
    queryKey: ["showcase", "workspaces"],
    queryFn: () => paseo.workspaces.list(),
  });
  const agents = useQuery({
    queryKey: ["showcase", "agents"],
    queryFn: () => paseo.agents.list(),
  });
  const config = useQuery({
    queryKey: ["showcase", "config"],
    queryFn: () => paseo.config.get(),
  });

  useEffect(() => {
    const stopWorkspaces = paseo.workspaces.subscribe((update) => {
      setEvents((prev) => ({ ...prev, workspace: prev.workspace + 1, last: `workspace ${update.kind}` }));
      void queryClient.invalidateQueries({ queryKey: ["showcase", "workspaces"] });
    });
    const stopAgents = paseo.agents.subscribe((update) => {
      setEvents((prev) => ({ ...prev, agent: prev.agent + 1, last: `agent ${update.kind}` }));
      void queryClient.invalidateQueries({ queryKey: ["showcase", "agents"] });
    });
    return () => {
      stopWorkspaces();
      stopAgents();
    };
  }, [paseo, queryClient]);

  const workspaceEntries = workspaces.data?.entries ?? [];
  const agentEntries = agents.data?.entries ?? [];
  const cfg = config.data?.config;

  return (
    <Card theme={theme} compact={layout.compact} title="Live SDK (usePaseo + subscriptions)" icon="Radio">
      <KeyValue theme={theme} label="workspace_update events" value={events.workspace} />
      <KeyValue theme={theme} label="agent_update events" value={events.agent} />
      <KeyValue theme={theme} label="last event" value={events.last} />
      {cfg ? (
        <>
          <KeyValue theme={theme} label="config.relay.enabled" value={cfg.relay?.enabled ?? "unset"} />
          <KeyValue theme={theme} label="config.mcp.enabled" value={cfg.mcp.enabled ?? "unset"} />
        </>
      ) : null}
      <Text style={{ color: theme.colors.foreground, fontWeight: "600", marginTop: 4 }}>
        Workspaces ({workspaceEntries.length})
      </Text>
      {workspaceEntries.slice(0, 8).map((workspace) => (
        <ListRow
          key={workspace.id}
          theme={theme}
          onPress={navigation ? () => navigation.openWorkspace({ workspaceId: workspace.id }) : undefined}
        >
          <Icon name="Folder" size={14} color={theme.colors.foregroundMuted} />
          <Text numberOfLines={1} style={{ color: theme.colors.foreground, fontSize: 13, flex: 1 }}>
            {workspace.title ?? workspace.name}
          </Text>
          <Muted theme={theme}>{workspace.projectDisplayName}</Muted>
          <Badge theme={theme} label={workspace.status} />
        </ListRow>
      ))}
      <Text style={{ color: theme.colors.foreground, fontWeight: "600", marginTop: 4 }}>
        Agents ({agentEntries.length})
      </Text>
      {agentEntries.slice(0, 8).map(({ agent }) => (
        <ListRow
          key={agent.id}
          theme={theme}
          onPress={navigation ? () => navigation.openAgent({ agentId: agent.id }) : undefined}
        >
          <Icon name="Bot" size={14} color={theme.colors.foregroundMuted} />
          <Text numberOfLines={1} style={{ color: theme.colors.foreground, fontSize: 13, flex: 1 }}>
            {agent.title ?? agent.id.slice(0, 8)}
          </Text>
          <Muted theme={theme}>{agent.provider}</Muted>
          <Badge theme={theme} label={agent.status} color={statusColor(theme, agent.status)} />
        </ListRow>
      ))}
      <ButtonRow>
        <Button
          theme={theme}
          label="Refresh lists"
          icon="RefreshCw"
          variant="secondary"
          onPress={() => {
            void workspaces.refetch();
            void agents.refetch();
            void config.refetch();
          }}
        />
        <Button
          theme={theme}
          label="Refresh providers"
          icon="Cpu"
          variant="secondary"
          onPress={() => {
            void paseo.providers
              .refresh()
              .then(() => toast.show("Provider refresh requested", { variant: "info" }))
              .catch((error: unknown) => toast.error(String(error)));
          }}
        />
      </ButtonRow>
      {!navigation ? <Muted theme={theme}>Row navigation is hidden because this host lacks navigation.</Muted> : null}
    </Card>
  );
}

function NotesSection({ theme, layout }: SectionProps) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const fetchNotes = useRpc(listNotes);
  const createNote = useRpc(addNote);
  const deleteNote = useRpc(removeNote);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const notes = useQuery({
    queryKey: ["showcase", "notes"],
    queryFn: () => fetchNotes({}),
  });
  const add = useMutation({
    mutationFn: createNote,
    onSuccess: (note) => {
      setTitle("");
      setBody("");
      toast.show(`Saved “${note.title}”`, { variant: "success" });
      void queryClient.invalidateQueries({ queryKey: ["showcase", "notes"] });
    },
    onError: (error) => toast.error(String(error)),
  });
  const remove = useMutation({
    mutationFn: deleteNote,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["showcase", "notes"] }),
    onError: (error) => toast.error(String(error)),
  });

  const inputStyle = {
    color: theme.colors.foreground,
    backgroundColor: theme.colors.surface2,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  };

  return (
    <Card theme={theme} compact={layout.compact} title="Notes (mutations + attachment source)" icon="StickyNote">
      <Muted theme={theme}>
        Notes persist on the daemon machine. In any composer, open the attachment menu and pick
        “Showcase note” to attach one to a prompt.
      </Muted>
      <TextInput
        placeholder="Title"
        placeholderTextColor={theme.colors.foregroundMuted}
        value={title}
        onChangeText={setTitle}
        style={inputStyle}
      />
      <TextInput
        placeholder="Body"
        placeholderTextColor={theme.colors.foregroundMuted}
        value={body}
        onChangeText={setBody}
        multiline
        style={[inputStyle, { minHeight: 64 }]}
      />
      <ButtonRow>
        <Button
          theme={theme}
          label={add.isPending ? "Saving…" : "Add note"}
          icon="Plus"
          disabled={add.isPending || title.trim().length === 0}
          onPress={() => add.mutate({ title, body })}
        />
      </ButtonRow>
      {notes.data?.file ? <KeyValue theme={theme} label="stored at" value={notes.data.file} mono /> : null}
      {(notes.data?.notes ?? []).map((note) => (
        <ListRow key={note.id} theme={theme}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ color: theme.colors.foreground, fontSize: 13, fontWeight: "600" }}>{note.title}</Text>
            {note.body ? (
              <Text numberOfLines={2} style={{ color: theme.colors.foregroundMuted, fontSize: 12 }}>
                {note.body}
              </Text>
            ) : null}
          </View>
          <Button theme={theme} label="Remove" icon="Trash2" variant="danger" onPress={() => remove.mutate({ id: note.id })} />
        </ListRow>
      ))}
      {notes.data && notes.data.notes.length === 0 ? <Muted theme={theme}>No notes yet.</Muted> : null}
    </Card>
  );
}

function ErrorSection({ theme, layout }: SectionProps) {
  const toast = useToast();
  const fail = useRpc(failOnPurpose);
  const [lastError, setLastError] = useState<string | null>(null);

  function run(mode: "throw" | "bad-output" | "bad-input") {
    const input = mode === "bad-input" ? ({ mode: "nope" } as unknown as { mode: "throw" }) : { mode };
    fail(input)
      .then(() => {
        setLastError(null);
        toast.show("Unexpected success", { variant: "warning" });
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        setLastError(message);
        toast.error(`RPC rejected: ${message}`);
      });
  }

  return (
    <Card theme={theme} compact={layout.compact} title="Error handling (Zod on both sides)" icon="TriangleAlert">
      <Muted theme={theme}>
        Each button makes the RPC fail a different way. Check `paseo plugin logs paseo-showcase` for
        the handler’s stderr.
      </Muted>
      <ButtonRow>
        <Button theme={theme} label="Handler throws" icon="Bomb" variant="secondary" onPress={() => run("throw")} />
        <Button theme={theme} label="Bad output" icon="FileX" variant="secondary" onPress={() => run("bad-output")} />
        <Button theme={theme} label="Bad input" icon="Ban" variant="secondary" onPress={() => run("bad-input")} />
      </ButtonRow>
      {lastError ? (
        <Text style={{ color: theme.colors.statusDanger, fontSize: 12, fontFamily: "monospace" }}>{lastError}</Text>
      ) : null}
    </Card>
  );
}

function AboutSection({ theme, layout }: SectionProps) {
  const [open, setOpen] = useState(false);
  const toast = useToast();
  const [count, setCount] = useState(0);
  return (
    <Card theme={theme} compact={layout.compact} title="Host UI (Modal, Toast, Icon, local state)" icon="LayoutTemplate">
      <KeyValue theme={theme} label="local counter" value={count} />
      <ButtonRow>
        <Button theme={theme} label="Increment" icon="Plus" variant="secondary" onPress={() => setCount((value) => value + 1)} />
        <Button theme={theme} label="Open modal" icon="AppWindow" onPress={() => setOpen(true)} />
        <Button theme={theme} label="Info toast" icon="Info" variant="secondary" onPress={() => toast.show("Hello from the showcase", { variant: "info" })} />
        <Button theme={theme} label="Error toast" icon="CircleX" variant="secondary" onPress={() => toast.error("Something went wrong on purpose")} />
      </ButtonRow>
      <Modal
        title="About this plugin"
        icon={<Icon name="Sparkles" size={18} color={theme.colors.foreground} />}
        open={open}
        onOpenChange={setOpen}
      >
        <Modal.Content>
          <View style={{ gap: 8, padding: 4 }}>
            <Text style={{ color: theme.colors.foreground, fontSize: 14 }}>
              This modal is a bottom sheet on compact layouts and a dialog elsewhere. Paseo owns the
              chrome, backdrop, and Escape handling.
            </Text>
            <Text style={{ color: theme.colors.foregroundMuted, fontSize: 13 }}>
              Contributions in this plugin: sidebar surface, workspace panel, agent panel, three
              Command Center items, composer pills, an attachment source, two themes, a timeline
              transformer with a renderer, and eight RPC handlers.
            </Text>
            <Button theme={theme} label="Close" onPress={() => setOpen(false)} />
          </View>
        </Modal.Content>
      </Modal>
    </Card>
  );
}
