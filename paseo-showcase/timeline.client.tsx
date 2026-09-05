import type { PluginTimelineItemProps, PluginTimelineTransformerContribution } from "@getpaseo/plugin";
import { Icon } from "@getpaseo/plugin/react-native";
import React from "react";
import { Text, View } from "react-native";
import { TOOL_CARD_KIND, TOOL_CARD_VERSION, type ToolCard } from "./contracts.shared";
import { Badge } from "./ui.client";

const PASEO_TOOL_PREFIX = "mcp__paseo__";

function summarize(detail: unknown): string | null {
  if (!detail || typeof detail !== "object") return null;
  const record = detail as Record<string, unknown>;
  if (typeof record.text === "string") return record.text.slice(0, 200);
  if (typeof record.label === "string") return record.label;
  if (record.type === "unknown" && record.input !== undefined) {
    try {
      return JSON.stringify(record.input).slice(0, 200);
    } catch {
      return null;
    }
  }
  return typeof record.type === "string" ? record.type : null;
}

export const paseoToolTransformer: PluginTimelineTransformerContribution<"tool_call"> = {
  id: "paseo-tool-card",
  query: { itemType: "tool_call" },
  transform({ item }) {
    if (!item.name.startsWith(PASEO_TOOL_PREFIX)) return undefined;
    const data: ToolCard = {
      tool: item.name.slice(PASEO_TOOL_PREFIX.length),
      status: item.status,
      callId: item.callId,
      summary: summarize(item.detail),
    };
    return {
      items: [{ type: "plugin", kind: TOOL_CARD_KIND, version: TOOL_CARD_VERSION, data }],
    };
  },
};

export function PaseoToolCard({ item, theme, layout, timestamp }: PluginTimelineItemProps<ToolCard>) {
  const { tool, status, summary } = item.data;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
        padding: layout.compact ? 10 : 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface1,
      }}
    >
      <Icon name="Plug" size={16} color={theme.colors.accent} />
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ color: theme.colors.foreground, fontSize: 13, fontWeight: "600", flexShrink: 1 }}>
            Paseo · {tool}
          </Text>
          <Badge theme={theme} label={status} />
        </View>
        {summary ? (
          <Text numberOfLines={3} style={{ color: theme.colors.foregroundMuted, fontSize: 12, fontFamily: "monospace" }}>
            {summary}
          </Text>
        ) : null}
        <Text style={{ color: theme.colors.foregroundMuted, fontSize: 11 }}>
          Rendered by paseo-showcase · {timestamp.toLocaleTimeString()}
        </Text>
      </View>
    </View>
  );
}
