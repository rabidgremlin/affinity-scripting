const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { SSEClientTransport } = require("@modelcontextprotocol/sdk/client/sse.js");
const { CallToolResultSchema } = require("@modelcontextprotocol/sdk/types.js");

function getTextContent(result) {
  return (result.content || [])
    .filter((item) => item && item.type === "text" && typeof item.text === "string")
    .map((item) => item.text)
    .join("\n");
}

async function main() {
  const query = process.argv.slice(2).join(" ").trim();
  if (!query) {
    console.error('Usage: node search_sdk.js "<query>"');
    process.exitCode = 1;
    return;
  }

  const client = new Client({
    name: "sdk-hints-search-client",
    version: "1.0.0",
  });
  const transport = new SSEClientTransport(new URL("http://localhost:6767/sse"));

  try {
    await client.connect(transport);

    const result = await client.request(
      {
        method: "tools/call",
        params: {
          name: "search_sdk_hints",
          arguments: {
            prompt: query,
          },
        },
      },
      CallToolResultSchema
    );

    const text = getTextContent(result);
    if (text) {
      console.log(text);
    } else {
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to search SDK hints: ${message}`);
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
