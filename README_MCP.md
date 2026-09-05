# Adaptive Teaching – MCP Layer

A standard **Model Context Protocol** server mounted on top of the Adaptive Teaching system.
External assistants (Gemini CLI, Claude Code, Cursor, Claude Desktop, …) can read and
influence the learner model **without touching the database or the adaptive logic**.

```
 assistant ──JSON-RPC 2.0 / HTTP──▶ /api/mcp ──▶ src/lib/mcp/server.ts ──▶ src/lib/mcp/tools.ts
                                                                                 │  (thin adapters)
                                                                                 ▼
                                                     src/lib/middleware/{signal-extractor, learner-summary,
                                                                          graph-engine, learner-model}
```

## Files

| Path | Role |
| --- | --- |
| `src/lib/mcp/server.ts` | Dependency-free JSON-RPC 2.0 / MCP dispatcher (`initialize`, `ping`, `tools/list`, `tools/call`, empty `resources/prompts` lists). Transport-agnostic. |
| `src/lib/mcp/tools.ts` | Tool registry. Each tool validates input and calls the **existing** middleware function. |
| `src/app/api/mcp/route.ts` | HTTP binding – MCP *Streamable HTTP* transport in stateless mode (`POST`, `GET` manifest, `DELETE`, `OPTIONS`, CORS). |
| `src/lib/mcp/client.ts` | Tiny client for internal use/tests: `createInProcessClient()` and `createHttpClient(url)`. |
| `scripts/mcp-stdio-bridge.mjs` | stdio ⇄ HTTP bridge for assistants that only speak stdio. |

Nothing in `src/lib/middleware/` is modified by the MCP layer – tools only **import** from it.

## Tools

| Tool | Kind | Delegates to | Arguments |
| --- | --- | --- | --- |
| `get_snapshot` | read | `getSnapshot()` – `signal-extractor` | `learnerId?`, `signalLimit?` |
| `get_summary` | read | `getSummary()` – `learner-summary` | `learnerId?` |
| `query_graph` | read | `getNodes()`, `getEdges()` – `graph-engine` | `learnerId?`, `nodeType?`, `edgeType?`, `concept?`, `branchId?`, `fromNodeId?`, `toNodeId?`, `include?`, `limit?` |
| `update_estimate` | write | `updateEstimate()` – `learner-model` | `concept`, `evidence?` (0..1) **or** `mastery?` (0..1), `weight?`, `learnerId?` |
| `branch_if` | write | `branchIfThreshold()` – `graph-engine` | `concept`, `threshold?` (default 0.4), `apply?` (default `true`; `false` = dry-run), `learnerId?` |
| `get_tip` | read | `getTip()` – `graph-engine` | `learnerId?`, `branchId?` |

* `learnerId` is any stable string (defaults to `"default"`); the learner is created on first use.
* Known concepts: `fractions`, `decimals`, `percentages`, `ratios`, `algebra-basics`.
* Results are returned both as `content[0].text` (pretty JSON) and `structuredContent`.
* Domain/validation problems come back as a tool result with `isError: true` (so the LLM can self-correct);
  protocol problems use standard JSON-RPC error codes (`-32700`, `-32600`, `-32601`, `-32602`, `-32603`).

## Run

```bash
npm install
npx drizzle-kit push      # creates learners/sessions/messages/branches/nodes/edges/estimates/signals
npm run dev               # http://localhost:3000  (dashboard + MCP playground)
```

The MCP endpoint is `http://localhost:3000/api/mcp`.

### Optional auth

Set `MCP_AUTH_TOKEN=<secret>` in `.env`; the endpoint then requires `Authorization: Bearer <secret>`.
Without the variable the endpoint is open (fine for local use).

## Connect an assistant

### Gemini CLI  (`~/.gemini/settings.json` or `.gemini/settings.json` in the project)

```json
{
  "mcpServers": {
    "adaptive-teaching": {
      "httpUrl": "http://localhost:3000/api/mcp",
      "timeout": 30000
    }
  }
}
```

Then in Gemini CLI: `/mcp` lists the six tools; ask e.g. *"Use get_summary for learner demo and tell me what to teach next."*

### Claude Code

```bash
claude mcp add --transport http adaptive-teaching http://localhost:3000/api/mcp
```

### Cursor  (`.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "adaptive-teaching": { "url": "http://localhost:3000/api/mcp" }
  }
}
```

### stdio-only clients (e.g. Claude Desktop)

```json
{
  "mcpServers": {
    "adaptive-teaching": {
      "command": "node",
      "args": ["/absolute/path/to/project/scripts/mcp-stdio-bridge.mjs"],
      "env": { "MCP_URL": "http://localhost:3000/api/mcp" }
    }
  }
}
```

## Raw protocol example

```bash
# 1. initialize
curl -s http://localhost:3000/api/mcp -H 'content-type: application/json' -d '{
  "jsonrpc":"2.0","id":1,"method":"initialize",
  "params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"curl","version":"0"}}}'

# 2. initialized notification -> 202 Accepted, empty body
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/api/mcp \
  -H 'content-type: application/json' -d '{"jsonrpc":"2.0","method":"notifications/initialized"}'

# 3. list tools
curl -s http://localhost:3000/api/mcp -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'

# 4. call a tool
curl -s http://localhost:3000/api/mcp -H 'content-type: application/json' -d '{
  "jsonrpc":"2.0","id":3,"method":"tools/call",
  "params":{"name":"branch_if","arguments":{"learnerId":"demo","concept":"fractions","apply":false}}}'
```

Response shape of `tools/call`:

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [{ "type": "text", "text": "{ ...pretty json... }" }],
    "structuredContent": { "shouldBranch": true, "applied": false, "reason": "...", "mastery": 0.22, "...": "..." }
  }
}
```

## Internal client (tests / server components)

```ts
import { createInProcessClient } from "@/lib/mcp/client";

const mcp = createInProcessClient();
await mcp.initialize();
const tools = await mcp.listTools();                       // 6 tools
const res = await mcp.callTool("get_tip", { learnerId: "demo" });
console.log(res.structuredContent);
```

`createHttpClient("http://localhost:3000/api/mcp")` has the same interface but goes over HTTP.

## Transport notes

* Stateless Streamable HTTP: every `POST` is independent, no `Mcp-Session-Id` is required.
* `POST` with a request → `200` + `application/json` (or a single SSE `message` event if the client
  only accepts `text/event-stream`). Notifications → `202` with empty body. Batches are accepted.
* `GET` with `Accept: text/event-stream` → `405` (no server-initiated streams); plain `GET` returns a discovery manifest.
* `DELETE` → `200` (nothing to tear down). `OPTIONS` → CORS preflight.
* Negotiated protocol versions: `2025-06-18`, `2025-03-26`, `2024-11-05`.
