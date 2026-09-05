# paseo-plugin-inspector

A Paseo plugin that shows what the Paseo 0.7 plugin SDK can do.

The plugin id is `paseo-showcase`. It was built and installed against Paseo 0.7.2. It adds 8 types of contribution and 9 RPC handlers. The first table gives each one.

## What the plugin adds

| Contribution | Where you find it |
| --- | --- |
| Sidebar screen `dashboard` | Sidebar, item "Showcase" |
| Workspace panel `workspace-inspector` | Workspace tab bar, Explorer, or Command Center |
| Agent panel `agent-inspector` | Agent tab bar, Command Center, or the composer pill |
| Command Center items, 4 | ⌘K on macOS or Ctrl+K on Windows and Linux. Search for "showcase". |
| Composer pill | The composer of each open agent |
| Attachment source `notes` | The attachment menu of the composer, item "Showcase note" |
| Themes `showcase-dusk` and `showcase-dawn` | Settings, Appearance |
| Timeline card | Each `mcp__paseo__*` tool call in an agent timeline |
| RPC handlers, 9 | `paseo-showcase/contracts.shared.ts` |

## What the sidebar screen shows

The screen has 8 cards. Each card uses a different part of the SDK.

| Card | SDK feature |
| --- | --- |
| Host and layout props | `host`, `layout`, and `navigation` |
| Theme tokens | The 11 colors in `theme.colors` |
| Daemon machine | `useRpc` with TanStack `useQuery`. The handler reads `node:os`. |
| Daemon overview | The handler uses the `paseo` API on the daemon |
| Live SDK | `usePaseo`, `workspaces.subscribe`, `agents.subscribe`, and `config.get` |
| Notes | `useMutation`, a JSON file on the daemon, and the attachment source |
| Error handling | 3 RPC failures: a thrown error, bad output, and bad input |
| Host UI | `Modal`, `Icon`, `useToast`, and local state |

## What the panels show

The workspace panel reads the workspace with `useWorkspace`. It shows the last 10 commits from `git log`. It can change the workspace title with the SDK.

The agent panel reads the agent with `useAgent`. It counts the timeline entries on the daemon, and it counts live stream events with `timeline.subscribe`. It can send a prompt to the agent. The composer pill opens this panel.

## Install

Plugin code runs unsandboxed on the daemon machine. It can read files, start processes, and use the network. Read the source before you install it.

1. Open Settings, Plugins. Turn on "Enable plugins".
2. Clone this repository to the daemon machine.
3. Run the commands below from the `paseo-showcase` directory.

```bash
npm install
npm run typecheck
paseo plugin install /absolute/path/to/paseo-showcase
paseo plugin ls
```

4. Make sure that `paseo plugin ls` shows `paseo-showcase` with the status `running`.

After you change the source, run `npm run typecheck` and then `paseo plugin reload paseo-showcase`. Read the daemon output with `paseo plugin logs paseo-showcase`.

The plugin stores notes in `~/.paseo-showcase/notes.json` on the daemon machine.

## What the 0.7.2 SDK does not have

- `addClientSlashCommand`. Composer slash commands are in the 0.8 preview.
- `timeline.append`. Daemon-appended timeline rows are in the 0.8 preview.

## What was checked

- `npm run typecheck` passes.
- `paseo plugin ls` shows `running` with no error.
- `paseo plugin logs paseo-showcase` shows the cleanup line on reload.
- I did not open the screens in the app. The layout on mobile and in each theme is not checked.

## Files

| File | What it does |
| --- | --- |
| `paseo-showcase/index.ts` | Registers each contribution and returns the cleanup |
| `paseo-showcase/contracts.shared.ts` | Zod contracts for the 9 RPCs and the attachment source |
| `paseo-showcase/handlers.server.ts` | RPC handlers. Uses `node:os`, `node:fs`, and `node:child_process` |
| `paseo-showcase/dashboard.client.tsx` | The sidebar screen |
| `paseo-showcase/workspace-panel.client.tsx` | The workspace panel |
| `paseo-showcase/agent-panel.client.tsx` | The agent panel |
| `paseo-showcase/timeline.client.tsx` | The timeline transformer and the card |
| `paseo-showcase/pills.client.tsx` | The composer pill |
| `paseo-showcase/ui.client.tsx` | Shared UI parts |

## License

MIT. See `LICENSE`.
