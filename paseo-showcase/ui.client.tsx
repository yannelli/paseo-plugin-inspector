import type { PluginTheme } from "@getpaseo/plugin";
import { Icon } from "@getpaseo/plugin/react-native";
import React, { type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

export function statusColor(theme: PluginTheme, status: string): string {
  switch (status) {
    case "running":
    case "loading":
    case "initializing":
      return theme.colors.statusWarning;
    case "done":
    case "idle":
    case "ready":
    case "completed":
      return theme.colors.statusSuccess;
    case "failed":
    case "error":
    case "unavailable":
    case "canceled":
      return theme.colors.statusDanger;
    case "attention":
    case "needs_input":
      return theme.colors.accent;
    default:
      return theme.colors.foregroundMuted;
  }
}

export function Card({
  theme,
  compact,
  title,
  icon,
  children,
}: {
  theme: PluginTheme;
  compact: boolean;
  title: string;
  icon: string;
  children: ReactNode;
}) {
  return (
    <View
      style={{
        backgroundColor: theme.colors.surface1,
        borderColor: theme.colors.border,
        borderWidth: 1,
        borderRadius: 12,
        padding: compact ? 12 : 16,
        gap: compact ? 8 : 10,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Icon name={icon} size={16} color={theme.colors.foreground} />
        <Text style={{ color: theme.colors.foreground, fontSize: compact ? 15 : 16, fontWeight: "600" }}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

export function KeyValue({
  theme,
  label,
  value,
  mono,
}: {
  theme: PluginTheme;
  label: string;
  value: string | number | boolean | null | undefined;
  mono?: boolean;
}) {
  const text = value === null || value === undefined ? "—" : String(value);
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
      <Text style={{ color: theme.colors.foregroundMuted, fontSize: 13 }}>{label}</Text>
      <Text
        numberOfLines={1}
        style={{
          color: theme.colors.foreground,
          fontSize: 13,
          flexShrink: 1,
          textAlign: "right",
          fontFamily: mono ? "monospace" : undefined,
        }}
      >
        {text}
      </Text>
    </View>
  );
}

export function Muted({ theme, children }: { theme: PluginTheme; children: ReactNode }) {
  return <Text style={{ color: theme.colors.foregroundMuted, fontSize: 13 }}>{children}</Text>;
}

export function Badge({ theme, label, color }: { theme: PluginTheme; label: string; color?: string }) {
  const tint = color ?? statusColor(theme, label);
  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: tint,
        backgroundColor: theme.colors.surface2,
      }}
    >
      <Text style={{ color: tint, fontSize: 11, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}

export function Button({
  theme,
  label,
  icon,
  onPress,
  variant = "primary",
  disabled,
}: {
  theme: PluginTheme;
  label: string;
  icon?: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}) {
  const background =
    variant === "primary"
      ? theme.colors.accent
      : variant === "danger"
        ? theme.colors.statusDanger
        : theme.colors.surface2;
  const foreground = variant === "secondary" ? theme.colors.foreground : theme.colors.accentForeground;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 9,
        paddingHorizontal: 14,
        borderRadius: 8,
        backgroundColor: background,
        borderWidth: variant === "secondary" ? 1 : 0,
        borderColor: theme.colors.border,
        opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
      })}
    >
      {icon ? <Icon name={icon} size={14} color={foreground} /> : null}
      <Text style={{ color: foreground, fontSize: 13, fontWeight: "600" }}>{label}</Text>
    </Pressable>
  );
}

export function ButtonRow({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{children}</View>;
}

export function ListRow({
  theme,
  onPress,
  children,
}: {
  theme: PluginTheme;
  onPress?: () => void;
  children: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 8,
        backgroundColor: pressed ? theme.colors.surface2 : theme.colors.surface0,
      })}
    >
      {children}
    </Pressable>
  );
}
