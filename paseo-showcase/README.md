# paseo-showcase

The plugin source. The README in the repository root gives what the plugin adds and how to install it.

## Develop

```bash
npm install
npm run typecheck
paseo plugin install /absolute/path/to/paseo-showcase
paseo plugin reload paseo-showcase
paseo plugin logs paseo-showcase
```

The plugin stores notes in `~/.paseo-showcase/notes.json` on the daemon machine.
