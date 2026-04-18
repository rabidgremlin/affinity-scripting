# Affinity Scripting LookSee & Tools

Before using these scripts, enable the Affinity MCP connector:  
https://www.affinity.studio/help/ai-connector-setup/#configure-affinity

## Prerequisites

- Node.js installed
- Dependencies installed with `npm install`
- MCP server available at `http://localhost:6767/sse`

## MCP Inspector
To look at the Affinity MCP server and see what it can do, you can use the MCP Inspector tool:

```bash
npx @modelcontextprotocol/inspector --sse http://localhost:6767/sse
```

## Scripts

### `extract_docs.js`

Downloads all SDK documentation topics from MCP and saves them under `docs/`, preserving any nested paths returned by the server.

Run:

```bash
node extract_docs.js
```

### `search_sdk.js`

Searches SDK hints using MCP and prints the response to the console.

Run:

```bash
node search_sdk.js "blend mode"
```

### `script_mgr.js`

Manages scripts in the Affinity script library.

Commands:

```bash
node script_mgr.js list
node script_mgr.js add --title "Hello World" --description  "Says Hello World" --file helloworldexample.js
node script_mgr.js save --title "Hello World"
node script_mgr.js save --title "Hello World" --out exports/hello-world.js
```

- `list`: lists installed library scripts
- `add`: adds a script from a local file
- `save`: reads a library script and saves it to disk

**NOTE**: You cannot delete a script via the MCP so you will need to delete them in Affinity in the scripts panel.