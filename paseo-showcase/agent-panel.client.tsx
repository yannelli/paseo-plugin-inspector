import { type PluginAgentPanelProps, useAgent, usePaseo, useRpc, useWorkspace } from "@getpaseo/plugin";
import { useToast } from "@getpaseo/plugin/react-native";
import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { agentSummary } from "./contracts.shared";
import { Badge, Button, ButtonRow, Card, KeyValue, Muted } from "./ui.client";

export function AgentInspector({ theme, layout, workspaceId, agentId, navigation }: PluginAgentPanelProps) {
  const agent = useAgent(agentId, (snapshot) => ({
    title: snapshot.title,
    provider: snapshot.provider,
    model: snapshot.model,
    status: snapshot.status,
    cwd: snapshot.cwd,
    currentModeId: snapshot.currentModeId,
    thinkingOptionId: snapshot.thinkingOptionId,
    requiresAttention: snapshot.requiresAttention,
    attentionReason: snapshot.attentionReason,
    parentAgentId: snapshot.parentAgentId,
    createdAt: snapshot.createdAt,
    lastActivityAt: snapshot.lastActivityAt,
    labels: snapshot.labels,
  }));
  const workspaceName = useWorkspace(workspaceId, (snapshot) => snapshot.title ?? snapshot.name);
  const paseo = usePaseo();
  const toast = useToast();
  const fetchSummary = useRpc(agentSummary);
  const [stream, setStream] = useState({ count: 0, lastType: "none yet" });

  const summary = useQuery({
    queryKey: ["showcase", "agent-summary", agentId],
    queryFn: () => fetchSummary({ agentId }),
  });

  useEffect(() => {
    const stop = paseo.agents.ref(agentId).timeline.subscribe((event) => {
      setStream((prev) => ({ count: prev.count + 1, lastType: event.event.type }));
    });
    return stop;
  }, [paseo, agentId]);

  const styles = useMemo(
    () => ({
      screen: { flex: 1, backgroundColor: theme.colors.surface0 },
      content: { padding: layout.compact ? 12 : 20, gap: layout.compact ? 10 : 14 },
      heading: { color: theme.colors.foreground, fontSize: layout.compact ? 18 : 22, fontWeight: "700" as const },
    }),
    [theme, layout.compact],
  );

  if (!agent) {
    return (
      <View style={[styles.screen, styles.content]}>
        <Muted theme={theme}>Agent {agentId} is not in the client cache.</Muted>
      </View>
    );
  }

  const labels = Object.entries(agent.labels);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Text style={[styles.heading, { flex: 1 }]} numberOfLines={1}>
          {agent.title ?? agentId.slice(0, 8)}
        </Text>
        <Badge theme={theme} label={agent.status} />
      </View>
      <Card theme={theme} compact={layout.compact} title="useAgent snapshot" icon="Bot">
        <KeyValue theme={theme} label="id" value={agentId} mono />
        <KeyValue theme={theme} label="workspace" value={workspaceName} />
        <KeyValue theme={theme} label="provider" value={agent.provider} />
        <KeyValue theme={theme} label="model" value={agent.model} mono />
        <KeyValue theme={theme} label="mode" value={agent.currentModeId} />
        <KeyValue theme={theme} label="thinking" value={agent.thinkingOptionId} />
        <KeyValue theme={theme} label="cwd" value={agent.cwd} mono />
        <KeyValue theme={theme} label="requires attention" value={agent.requiresAttention} />
        <KeyValue theme={theme} label="attention reason" value={agent.attentionReason} />
        <KeyValue theme={theme} label="parent agent" value={agent.parentAgentId} mono />
        <KeyValue theme={theme} label="created" value={agent.createdAt} mono />
        <KeyValue theme={theme} label="last activity" value={agent.lastActivityAt} mono />
        {labels.length > 0 ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {labels.map(([key, value]) => (
              <Badge key={key} theme={theme} label={`${key}=${value}`} color={theme.colors.foregroundMuted} />
            ))}
          </View>
        ) : (
          <Muted theme={theme}>No labels.</Muted>
        )}
      </Card>
      <Card theme={theme} compact={layout.compact} title="Timeline summary (RPC reads the timeline server-side)" icon="ListTree">
        {summary.isError ? <Text style={{ color: theme.colors.statusDanger }}>{String(summary.error)}</Text> : null}
        {summary.data ? (
          <>
            <KeyValue theme={theme} label="entries" value={summary.data.entryCount} />
            <KeyValue theme={theme} label="user messages" value={summary.data.userMessages} />
            <KeyValue theme={theme} label="assistant messages" value={summary.data.assistantMessages} />
            <KeyValue theme={theme} label="reasoning blocks" value={summary.data.reasoningBlocks} />
            <KeyValue theme={theme} label="tool calls" value={summary.data.toolCalls} />
            <KeyValue theme={theme} label="failed tool calls" value={summary.data.failedToolCalls} />
            <KeyValue theme={theme} label="last tool" value={summary.data.lastToolName} mono />
            {summary.data.error ? <Text style={{ color: theme.colors.statusDanger }}>{summary.data.error}</Text> : null}
          </>
        ) : (
          <Muted theme={theme}>{summary.isLoading ? "Loading…" : "No data"}</Muted>
        )}
        <ButtonRow>
          <Button theme={theme} label="Refresh" icon="RefreshCw" variant="secondary" onPress={() => void summary.refetch()} />
        </ButtonRow>
      </Card>
      <Card theme={theme} compact={layout.compact} title="Live stream (timeline.subscribe)" icon="Activity">
        <KeyValue theme={theme} label="events since panel opened" value={stream.count} />
        <KeyValue theme={theme} label="last event type" value={stream.lastType} mono />
        <ButtonRow>
          <Button
            theme={theme}
            label="Send “ping” prompt"
            icon="Send"
            onPress={() => {
              void paseo.agents
                .ref(agentId)
                .send("Reply with exactly one word: pong.")
                .then(() => toast.show("Prompt sent", { variant: "success" }))
                .catch((error: unknown) => toast.error(error instanceof Error ? error.message : String(error)));
            }}
          />
          <Button
            theme={theme}
            label="Refresh snapshot"
            icon="RefreshCw"
            variant="secondary"
            onPress={() => {
              void paseo.agents
                .ref(agentId)
                .refresh()
                .then(() => toast.show("Snapshot refreshed", { variant: "info" }))
                .catch((error: unknown) => toast.error(String(error)));
            }}
          />
          {navigation ? (
            <Button theme={theme} label="Open workspace" icon="Folder" variant="secondary" onPress={() => navigation.openWorkspace({ workspaceId })} />
          ) : null}
        </ButtonRow>
      </Card>
    </ScrollView>
  );
}
