# Affinity Scripting LookSee & Tools

What is is this repo is based on the April 2026 (3.2) release of Affinity.

## Findings
- The MCP server has access to a bunch of documentation that an AI agent can use as reference for creating scripts etc. The `extract_docs.js` script below can extract all these docs and save them locally so you can take a look at them. This includes some example affinity scripts.
- Affinity has a scripts panel (Window > General > Scripts) which lets you see and run scripts created by the AI. However you cannot see the actual script's code, edit it or create your own scripts in the UI. The `script_mgr.js` script below can be used to manage scripts in the library (add, list, save to disk). 
- The documentation tells the AI agent to use `search_sdk_skills` to search for solutions before creating its own. This doesn't actually exist in the list of MCP tools but there is a `search_sdk_hints` tool. The `search_sdk.js` script below can be used to call this tool, just pass it a search query. In my testing the returned results are not that accurate but they will no doubt get better over time, because the description for that tool says _Search a global pool of SDK hints from millions of other MCP sessions. Use it to check for existing solutions to problems you are facing._
- There is a `add_sdk_hint` tool in the MCP which I'm guessing goes hand in hand with `search_sdk_hints` but it's documentation seems to indicate that actually updates the `preamble` doc. 


## Prerequisites
- enable the Affinity MCP connector: https://www.affinity.studio/help/ai-connector-setup/#configure-affinity NOTE: You do not need to set up Claude or the Claude connector
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

## Notes
- The code in this repo was thrown together by Codex as I was tinkering so don't expect any masterful coding here
- Don't use this code or the MCP to do dumb and/or illegal things!