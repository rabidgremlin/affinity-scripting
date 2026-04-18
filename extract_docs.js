const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { SSEClientTransport } = require("@modelcontextprotocol/sdk/client/sse.js");
const { CallToolResultSchema } = require("@modelcontextprotocol/sdk/types.js");
const fs = require("node:fs/promises");
const path = require("node:path");

function parseCsvTextContent(result) {
  const textChunks = (result.content || [])
    .filter((item) => item && item.type === "text" && typeof item.text === "string")
    .map((item) => item.text);

  const names = textChunks
    .join(",")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  return [...new Set(names)];
}

function parseTextContent(result) {
  return (result.content || [])
    .filter((item) => item && item.type === "text" && typeof item.text === "string")
    .map((item) => item.text)
    .join("\n");
}

function resolveDocsPath(docsRoot, sdkName) {
  const outputPath = path.resolve(docsRoot, sdkName);
  const relative = path.relative(docsRoot, outputPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Unsafe SDK doc path "${sdkName}"`);
  }
  return outputPath;
}

async function main() {
  const client = new Client({
    name: "sdk-docs-file-lister",
    version: "1.0.0",
  });

  const transport = new SSEClientTransport(new URL("http://localhost:6767/sse"));
  const docsRoot = path.resolve(process.cwd(), "docs");

  try {
    await client.connect(transport);

    const listResult = await client.request(
      {
        method: "tools/call",
        params: {
          name: "list_sdk_documentation",
          arguments: {},
        },
      },
      CallToolResultSchema
    );

    const fileNames = parseCsvTextContent(listResult);
    const failures = [];
    let savedCount = 0;

    await fs.mkdir(docsRoot, { recursive: true });

    for (const fileName of fileNames) {
      try {
        const readResult = await client.request(
          {
            method: "tools/call",
            params: {
              name: "read_sdk_documentation_topic",
              arguments: {
                filename: fileName,
              },
            },
          },
          CallToolResultSchema
        );

        const content = parseTextContent(readResult);
        const outputPath = resolveDocsPath(docsRoot, fileName);

        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.writeFile(outputPath, content, "utf8");

        console.log(`Saved: ${fileName}`);
        savedCount += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failures.push({ fileName, message });
        console.error(`Failed: ${fileName} - ${message}`);
      }
    }

    console.log(
      `Completed. Total: ${fileNames.length}, Saved: ${savedCount}, Failed: ${failures.length}`
    );

    if (failures.length > 0) {
      process.exitCode = 1;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to process SDK documentation files: ${message}`);
    process.exitCode = 1;
  } finally {
    try {
      await transport.close();
    } catch (_) {
      // Ignore close errors so the main result/error is preserved.
    }
  }
}

main();
