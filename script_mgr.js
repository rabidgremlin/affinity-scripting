const fs = require("node:fs/promises");
const path = require("node:path");
const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { SSEClientTransport } = require("@modelcontextprotocol/sdk/client/sse.js");
const { CallToolResultSchema } = require("@modelcontextprotocol/sdk/types.js");

const SERVER_URL = "http://localhost:6767/sse";

function usage() {
  return [
    'Usage:',
    '  node script_mgr.js list',
    '  node script_mgr.js add --title "<title>" --description "<description>" --file "<path>"',
    '  node script_mgr.js save --title "<title>" [--out "<path>"]',
  ].join("\n");
}

function getTextContent(result) {
  return (result.content || [])
    .filter((item) => item && item.type === "text" && typeof item.text === "string")
    .map((item) => item.text)
    .join("\n");
}

function parseFlags(args) {
  const flags = {};
  for (let i = 0; i < args.length; i += 1) {
    const part = args[i];
    if (!part.startsWith("--")) {
      continue;
    }
    const key = part.slice(2);
    const value = args[i + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }
    flags[key] = value;
    i += 1;
  }
  return flags;
}

function sanitizeTitleToFilename(title) {
  const sanitized = title
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/g, "");
  const base = sanitized || "script";
  return base.toLowerCase().replace(/\s+/g, "-") + ".js";
}

async function callTool(client, name, args) {
  return client.request(
    {
      method: "tools/call",
      params: {
        name,
        arguments: args,
      },
    },
    CallToolResultSchema
  );
}

async function run() {
  const [command, ...rest] = process.argv.slice(2);
  if (!command) {
    throw new Error(usage());
  }

  const client = new Client({ name: "script-mgr-cli", version: "1.0.0" });
  const transport = new SSEClientTransport(new URL(SERVER_URL));

  try {
    await client.connect(transport);

    if (command === "list") {
      const result = await callTool(client, "list_library_scripts", {});
      const text = getTextContent(result);
      if (text) {
        console.log(text);
      } else {
        console.log(JSON.stringify(result, null, 2));
      }
      return;
    }

    const flags = parseFlags(rest);

    if (command === "add") {
      const title = (flags.title || "").trim();
      const description = (flags.description || "").trim();
      const filePath = (flags.file || "").trim();
      if (!title || !description || !filePath) {
        throw new Error(`Missing required flags for add.\n${usage()}`);
      }

      const code = await fs.readFile(path.resolve(process.cwd(), filePath), "utf8");
      const result = await callTool(client, "save_script_to_library", {
        title,
        description,
        code,
      });
      const text = getTextContent(result);
      console.log(text || JSON.stringify(result, null, 2));
      return;
    }

    if (command === "save") {
      const title = (flags.title || "").trim();
      if (!title) {
        throw new Error(`Missing required flag --title for save.\n${usage()}`);
      }

      const result = await callTool(client, "read_library_script", { title });
      const scriptText = getTextContent(result);
      if (!scriptText) {
        throw new Error(`No script content returned for "${title}".`);
      }

      const outputPath = flags.out
        ? path.resolve(process.cwd(), flags.out)
        : path.resolve(process.cwd(), sanitizeTitleToFilename(title));

      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, scriptText, "utf8");
      console.log(`Saved script "${title}" to ${outputPath}`);
      return;
    }

    throw new Error(`Unknown command "${command}".\n${usage()}`);
  } finally {
    try {
      await transport.close();
    } catch (_) {
      // Ignore close errors.
    }
  }
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
