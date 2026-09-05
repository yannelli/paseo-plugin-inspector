import { type PluginClientContext, type PluginComposerPillProps, useAgent } from "@getpaseo/plugin";
import { Icon } from "@getpaseo/plugin/react-native";
import React from "react";
import { Text } from "react-native";
import { PANEL_AGENT, agentSummary } from "./contracts.shared";

function InspectorPill({ theme, agentId }: PluginComposerPillProps) {
  const agent = useAgent(agentId, ({ status, requiresAttention }) => ({ status, requiresAttention }));
  const tint = agent?.requiresAttention ? theme.colors.statusWarning : theme.colors.foregroundMuted;
  return (
    <>
      <Icon name="Sparkles" size={14} color={tint} />
      <Text numberOfLines={1} style={{ color: tint, fontSize: 12, flexShrink: 1 }}>
        Inspect · {agent?.status ?? "unknown"}
      </Text>
    </>
  );
}

export function contributeClient(client: PluginClientContext) {
  const pills = new Map<string, () => void>();

  function attach(agentId: string, workspaceId: string) {
    pills.get(agentId)?.();
    pills.set(
      agentId,
      client.addComposerPill({
        id: "inspector",
        title: "Open the showcase agent inspector",
        workspaceId,
        agentId,
        Component: InspectorPill,
        async onPress() {
          await client.rpc(agentSummary, { agentId });
          client.openPanel(PANEL_AGENT, { workspaceId, agentId });
        },
      }),
    );
  }

  function detach(agentId: string) {
    pills.get(agentId)?.();
    pills.delete(agentId);
  }

  const unsubscribe = client.paseo.agents.subscribe((update) => {
    if (update.kind === "remove") {
      detach(update.agentId);
      return;
    }
    if (update.kind !== "upsert" || !update.agent.workspaceId) return;
    if (update.agent.status === "closed" || update.agent.archivedAt) {
      detach(update.agent.id);
      return;
    }
    if (!pills.has(update.agent.id)) attach(update.agent.id, update.agent.workspaceId);
  });

  void client.paseo.agents
    .list()
    .then((result) => {
      for (const { agent } of result.entries) {
        if (agent.workspaceId && agent.status !== "closed" && !agent.archivedAt) {
          attach(agent.id, agent.workspaceId);
        }
      }
    })
    .catch(() => {});

  return () => {
    unsubscribe();
    for (const remove of pills.values()) remove();
    pills.clear();
  };
}
