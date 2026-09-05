# paseo-showcase

A Paseo plugin that exercises the plugin SDK surface available in Paseo 0.7.x.

## Contributions

| Contribution | Where to find it |
| --- | --- |
| Sidebar surface `dashboard` | Sidebar → Showcase |
| Workspace panel `workspace-inspector` | Workspace tab strip, Explorer, or Command Center |
| Agent panel `agent-inspector` | Agent tab strip, Command Center, or the composer pill |
| Command Center items (global, workspace ×2, agent) | ⌘K / Ctrl+K, search "showcase" |
| Composer pill | Every open agent composer shows a pill with the agent status |
| Attachment source `notes` | Composer attachment menu → Showcase note |
| Themes `showcase-dusk`, `showcase-dawn` | Settings → Appearance |
| Timeline transformer + renderer | Any `mcp__paseo__*` tool call in an agent timeline |
| RPC handlers (9) | `contracts.shared.ts` |

## SDK features used

- `usePaseo()` for client-side SDK calls and `workspaces.subscribe` / `agents.subscribe` / `timeline.subscribe` streams
- `useWorkspace` / `useAgent` selectors
- `useRpc` with TanStack `useQuery` and `useMutation`
- `Modal`, `Icon`, `useToast` from `@getpaseo/plugin/react-native`
- `navigation.openWorkspace` / `navigation.openAgent`
- Server handlers using `node:os`, `node:fs`, `node:child_process`, and the handler's `paseo` API
- Cleanup: the server module registers a heartbeat timer in `serverCleanups`, and the contribute cleanup drains it

## Missing from the 0.7.2 SDK

- `addClientSlashCommand` (composer slash commands)
- `agents.ref(id).timeline.append` (daemon-appended timeline rows)

## Develop

```bash
npm install
npm run typecheck
paseo plugin install /absolute/path/to/paseo-showcase
paseo plugin reload paseo-showcase
paseo plugin logs paseo-showcase
```

Notes are stored at `~/.paseo-showcase/notes.json` on the daemon machine.
