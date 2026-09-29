import "dotenv/config";
import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import { employees, publicEmployees } from "./employees.js";

const MODEL = "claude-opus-5-5";
// Server-side refusal fallback: if a request is declined by a safety classifier,
// the API re-runs it on Anthropic's recommended fallback model in the same call.
const BETAS = ["server-side-fallback-2026-07-01"];
const MAX_CEO_STEPS = 8;

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment
const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

const delegateTool = {
  name: "delegate_task",
  description:
    "Assign a task to one of your team members and get their finished work back. " +
    "The team member cannot see this conversation, so include all context they need in the brief.",
  input_schema: {
    type: "object",
    properties: {
      employee: {
        type: "string",
        enum: ["strategist", "digital", "scriptwriter"],
        description: "strategist = Leo (strategy & advertising), digital = Maya (digital marketing), scriptwriter = Sam (scripts & copy)",
      },
      task: {
        type: "string",
        description: "A complete, self-contained brief: goal, product, audience, constraints and the expected deliverable.",
      },
    },
    required: ["employee", "task"],
    additionalProperties: false,
  },
  strict: true,
  eager_input_streaming: true,
};

app.get("/api/employees", (_req, res) => res.json(publicEmployees()));

app.post("/api/chat", async (req, res) => {
  const { employeeId, messages } = req.body ?? {};
  const employee = employees[employeeId];
  if (!employee || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Invalid request" });
  }

  res.set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
  res.flushHeaders();
  const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  const history = messages
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content }));

  try {
    if (employee.id === "ceo") {
      await runCeo(history, send);
    } else {
      await runEmployee(employee, history, (text) => send("delta", { text }), "medium");
    }
    send("done", {});
  } catch (err) {
    send("error", { message: describeError(err) });
  } finally {
    res.end();
  }
});

// One streamed Claude turn for a specialist. Returns the final text.
async function runEmployee(employee, messages, onText, effort) {
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 64000,
    betas: BETAS,
    fallbacks: "default",
    output_config: { effort },
    system: employee.system,
    messages,
  });
  stream.on("text", onText);
  const message = await stream.finalMessage();
  if (message.stop_reason === "refusal") {
    throw new Error(`${employee.name} declined this request.`);
  }
  return textOf(message.content);
}

// The CEO runs an agentic loop: it can call delegate_task, which runs a specialist
// and feeds their work back to the CEO, until the CEO writes the final answer.
async function runCeo(history, send) {
  const ceo = employees.ceo;
  const messages = [...history];

  for (let step = 0; step < MAX_CEO_STEPS; step++) {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 64000,
      betas: BETAS,
      fallbacks: "default",
      output_config: { effort: "high" },
      system: ceo.system,
      tools: [delegateTool],
      messages,
    });
    stream.on("text", (text) => send("delta", { text }));
    const message = await stream.finalMessage();

    if (message.stop_reason === "refusal") {
      throw new Error("Ava (CEO) declined this request.");
    }
    if (message.stop_reason === "max_tokens") {
      send("delta", { text: "\n\n_(Response was cut off - try asking for a shorter answer.)_" });
      return;
    }

    const content = echoableContent(message.content);
    messages.push({ role: "assistant", content });

    const toolUses = content.filter((b) => b.type === "tool_use");
    if (message.stop_reason !== "tool_use" || toolUses.length === 0) return;

    // Run every delegation from this turn in parallel; return all results in one user message.
    const results = await Promise.all(toolUses.map((block) => runDelegation(block, send)));
    messages.push({ role: "user", content: results });
  }
  send("delta", { text: "\n\n_(Stopped after too many delegation rounds.)_" });
}

async function runDelegation(block, send) {
  const { employee: id, task } = block.input ?? {};
  const member = id !== "ceo" ? employees[id] : undefined;
  if (!member || typeof task !== "string" || !task.trim()) {
    return {
      type: "tool_result",
      tool_use_id: block.id,
      is_error: true,
      content: "INVALID_JSON: delegate_task needs a valid employee and a non-empty task. Please try again.",
    };
  }

  send("delegate_start", { callId: block.id, employeeId: member.id, task });
  try {
    const work = await runEmployee(
      member,
      [{ role: "user", content: `Brief from Ava (CEO):\n\n${task}` }],
      (text) => send("delegate_delta", { callId: block.id, text }),
      "medium",
    );
    send("delegate_end", { callId: block.id });
    return { type: "tool_result", tool_use_id: block.id, content: work || "(no output)" };
  } catch (err) {
    const message = describeError(err);
    send("delegate_end", { callId: block.id, error: message });
    return { type: "tool_result", tool_use_id: block.id, is_error: true, content: message };
  }
}

// After a mid-output fallback, blocks produced before the last `fallback` marker
// (thinking, tool calls, unpaired server-tool calls) must not be echoed back.
function echoableContent(content) {
  const lastFallback = content.map((b) => b.type).lastIndexOf("fallback");
  if (lastFallback === -1) return content;
  const pairedIds = new Set(content.filter((b) => b.type.endsWith("_tool_result")).map((b) => b.tool_use_id));
  return content.filter((b, i) => {
    if (i >= lastFallback) return true;
    if (b.type === "text") return true;
    if (b.type === "server_tool_use") return pairedIds.has(b.id);
    if (b.type.endsWith("_tool_result")) return true;
    return false;
  });
}

function textOf(content) {
  return content.filter((b) => b.type === "text").map((b) => b.text).join("");
}

function describeError(err) {
  if (err instanceof Anthropic.AuthenticationError) return "Invalid or missing ANTHROPIC_API_KEY.";
  if (err instanceof Anthropic.RateLimitError) return "Rate limited by the Claude API - please wait a moment and retry.";
  if (err instanceof Anthropic.APIError) return `Claude API error ${err.status ?? ""}: ${err.message}`;
  return err?.message ?? String(err);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`AI Employees running at http://localhost:${PORT}`));
