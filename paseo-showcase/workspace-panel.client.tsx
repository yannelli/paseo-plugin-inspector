import { type PluginWorkspacePanelProps, usePaseo, useRpc, useWorkspace } from "@getpaseo/plugin";
import { Icon, Modal, useToast } from "@getpaseo/plugin/react-native";
import { useQuery } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { gitLog } from "./contracts.shared";
import { Badge, Button, ButtonRow, Card, KeyValue, Muted } from "./ui.client";

export function WorkspaceInspector({ theme, layout, workspaceId, navigation }: PluginWorkspacePanelProps) {
  const workspace = useWorkspace(workspaceId, (snapshot) => ({
    name: snapshot.name,
    title: snapshot.title,
    status: snapshot.status,
    statusEnteredAt: snapshot.statusEnteredAt,
    directory: snapshot.directory,
    projectDisplayName: snapshot.projectDisplayName,
    projectRootPath: snapshot.projectRootPath,
    projectKind: snapshot.projectKind,
    kind: snapshot.kind,
    diffStat: snapshot.diffStat,
    archivingAt: snapshot.archivingAt,
  }));
  const paseo = usePaseo();
  const toast = useToast();
  const fetchGitLog = useRpc(gitLog);
  const [renameOpen, setRenameOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");

  const log = useQuery({
    queryKey: ["showcase", "git-log", workspace?.directory],
    queryFn: () => fetchGitLog({ directory: workspace?.directory ?? "", limit: 10 }),
    enabled: Boolean(workspace?.directory),
  });

  const styles = useMemo(
    () => ({
      screen: { flex: 1, backgroundColor: theme.colors.surface0 },
      content: { padding: layout.compact ? 12 : 20, gap: layout.compact ? 10 : 14 },
      heading: { color: theme.colors.foreground, fontSize: layout.compact ? 18 : 22, fontWeight: "700" as const },
    }),
    [theme, layout.compact],
  );

  if (!workspace) {
    return (
      <View style={[styles.screen, styles.content]}>
        <Muted theme={theme}>Workspace {workspaceId} is not in the client cache.</Muted>
      </View>
    );
  }

  async function saveTitle(next: string | null) {
    try {
      await paseo.workspaces.ref(workspaceId).setTitle(next);
      toast.show(next ? `Renamed to “${next}”` : "Title cleared", { variant: "success" });
      setRenameOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Text style={[styles.heading, { flex: 1 }]} numberOfLines={1}>
          {workspace.title ?? workspace.name}
        </Text>
        <Badge theme={theme} label={workspace.status} />
      </View>
      <Card theme={theme} compact={layout.compact} title="useWorkspace snapshot" icon="FolderGit2">
        <KeyValue theme={theme} label="id" value={workspaceId} mono />
        <KeyValue theme={theme} label="name" value={workspace.name} />
        <KeyValue theme={theme} label="title" value={workspace.title} />
        <KeyValue theme={theme} label="project" value={workspace.projectDisplayName} />
        <KeyValue theme={theme} label="project kind" value={workspace.projectKind} />
        <KeyValue theme={theme} label="workspace kind" value={workspace.kind} />
        <KeyValue theme={theme} label="directory" value={workspace.directory} mono />
        <KeyValue theme={theme} label="project root" value={workspace.projectRootPath} mono />
        <KeyValue theme={theme} label="status since" value={workspace.statusEnteredAt} mono />
        <KeyValue theme={theme} label="archiving at" value={workspace.archivingAt} mono />
        <KeyValue
          theme={theme}
          label="diff"
          value={workspace.diffStat ? `+${workspace.diffStat.additions} / -${workspace.diffStat.deletions}` : null}
        />
        <ButtonRow>
          <Button theme={theme} label="Rename via SDK" icon="Pencil" onPress={() => { setDraftTitle(workspace.title ?? ""); setRenameOpen(true); }} />
          <Button theme={theme} label="Clear title" icon="Eraser" variant="secondary" onPress={() => void saveTitle(null)} />
          {navigation ? (
            <Button theme={theme} label="Focus workspace" icon="ExternalLink" variant="secondary" onPress={() => navigation.openWorkspace({ workspaceId })} />
          ) : null}
        </ButtonRow>
      </Card>
      <Card theme={theme} compact={layout.compact} title="Recent commits (git via RPC)" icon="GitCommitHorizontal">
        {log.data?.branch ? <KeyValue theme={theme} label="branch" value={log.data.branch} mono /> : null}
        {log.data?.error ? <Text style={{ color: theme.colors.statusDanger, fontSize: 12 }}>{log.data.error}</Text> : null}
        {log.isLoading ? <Muted theme={theme}>Loading…</Muted> : null}
        {(log.data?.commits ?? []).map((commit) => (
          <View key={commit.hash} style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
            <Text style={{ color: theme.colors.accent, fontFamily: "monospace", fontSize: 12 }}>{commit.shortHash}</Text>
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ color: theme.colors.foreground, fontSize: 13 }}>{commit.subject}</Text>
              <Text style={{ color: theme.colors.foregroundMuted, fontSize: 11 }}>
                {commit.author} · {commit.relativeDate}
              </Text>
            </View>
          </View>
        ))}
        <ButtonRow>
          <Button theme={theme} label="Refresh" icon="RefreshCw" variant="secondary" onPress={() => void log.refetch()} />
        </ButtonRow>
      </Card>
      <Modal
        title="Rename workspace"
        icon={<Icon name="Pencil" size={18} color={theme.colors.foreground} />}
        open={renameOpen}
        onOpenChange={setRenameOpen}
      >
        <Modal.Content>
          <View style={{ gap: 10, padding: 4 }}>
            <TextInput
              value={draftTitle}
              onChangeText={setDraftTitle}
              placeholder="New title"
              placeholderTextColor={theme.colors.foregroundMuted}
              style={{
                color: theme.colors.foreground,
                backgroundColor: theme.colors.surface2,
                borderColor: theme.colors.border,
                borderWidth: 1,
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 8,
              }}
            />
            <ButtonRow>
              <Button theme={theme} label="Save" icon="Check" disabled={draftTitle.trim().length === 0} onPress={() => void saveTitle(draftTitle.trim())} />
              <Button theme={theme} label="Cancel" variant="secondary" onPress={() => setRenameOpen(false)} />
            </ButtonRow>
          </View>
        </Modal.Content>
      </Modal>
    </ScrollView>
  );
}
