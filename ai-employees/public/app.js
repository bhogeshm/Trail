const $ = (sel) => document.querySelector(sel);
const teamEl = $("#team");
const messagesEl = $("#messages");
const currentEl = $("#current");
const form = $("#composer");
const input = $("#input");
const sendBtn = $("#send");

const SUGGESTIONS = {
  ceo: [
    "We're launching a new organic coffee brand in Bangalore next month. Build a full launch marketing plan.",
    "Plan a Diwali sale campaign for our online clothing store with a ₹2 lakh budget.",
  ],
  strategist: [
    "Define target personas and positioning for a budget fitness app for college students.",
    "Suggest 3 big campaign ideas for a local bakery's 10th anniversary.",
  ],
  digital: [
    "Create a 2-week Instagram content calendar for a skincare brand.",
    "Give me an SEO keyword plan for a dental clinic in Pune.",
  ],
  scriptwriter: [
    "Write a 30-second Instagram reel script for a food delivery app.",
    "Write a 60-second YouTube ad script for an online coding course.",
  ],
};

let team = [];
let byId = {};
let activeId = "ceo";
let busy = false;
const chats = loadChats(); // { [employeeId]: Message[] }
// Message: { role: "user", text } | { role: "assistant", parts: Part[] }
// Part:    { type: "text", text } | { type: "delegation", callId, employeeId, task, text, status }

init();

async function init() {
  team = await (await fetch("/api/employees")).json();
  byId = Object.fromEntries(team.map((e) => [e.id, e]));
  renderTeam();
  selectEmployee(activeId);
}

function renderTeam() {
  teamEl.innerHTML = "";
  for (const e of team) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "member" + (e.id === activeId ? " active" : "");
    btn.style.setProperty("--c", e.color);
    btn.innerHTML = `
      <span class="avatar">${e.avatar}</span>
      <span><strong>${esc(e.name)}</strong><span class="role">${esc(e.title)}</span><span class="tag">${esc(e.tagline)}</span></span>`;
    btn.addEventListener("click", () => !busy && selectEmployee(e.id));
    teamEl.append(btn);
  }
}

function selectEmployee(id) {
  activeId = id;
  const e = byId[id];
  renderTeam();
  currentEl.innerHTML = `<span class="avatar" style="--c:${e.color}">${e.avatar}</span>
    <div><h2>${esc(e.name)}</h2><p>${esc(e.title)}</p></div>`;
  input.placeholder = id === "ceo" ? "Brief the CEO on a project…" : `Ask ${e.name} something…`;
  renderMessages();
  input.focus();
}

function renderMessages() {
  const e = byId[activeId];
  const chat = chats[activeId] ?? [];
  messagesEl.innerHTML = "";
  if (chat.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.innerHTML = `<div class="avatar" style="--c:${e.color}">${e.avatar}</div>
      <h3>${esc(e.name)} · ${esc(e.title)}</h3><p>${esc(e.tagline)}</p><div class="suggestions"></div>`;
    for (const s of SUGGESTIONS[activeId] ?? []) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = s;
      b.addEventListener("click", () => { input.value = s; form.requestSubmit(); });
      empty.querySelector(".suggestions").append(b);
    }
    messagesEl.append(empty);
    return;
  }
  for (const m of chat) messagesEl.append(renderMessage(m, e));
  scrollDown();
}

function renderMessage(m, e) {
  const el = document.createElement("div");
  if (m.role === "user") {
    el.className = "msg user";
    el.innerHTML = `<div class="bubble">${esc(m.text)}</div>`;
    return el;
  }
  el.className = "msg bot";
  el.style.setProperty("--c", e.color);
  el.innerHTML = `<span class="avatar">${e.avatar}</span><div class="body"><div class="who">${esc(e.name)}</div></div>`;
  const body = el.querySelector(".body");
  for (const p of m.parts) body.append(renderPart(p));
  if (m.error) body.insertAdjacentHTML("beforeend", `<p class="error">⚠️ ${esc(m.error)}</p>`);
  if (m.parts.length === 0 && !m.error) body.append(renderPart({ type: "text", text: "" }, true));
  return el;
}

function renderPart(p, typing = false) {
  if (p.type === "text") {
    const div = document.createElement("div");
    div.className = "bubble" + (typing ? " typing" : "");
    div.innerHTML = markdown(p.text);
    return div;
  }
  const member = byId[p.employeeId];
  const d = document.createElement("details");
  d.className = "delegation";
  d.open = p.status === "working";
  d.style.setProperty("--c", member.color);
  const status = p.status === "working" ? "working…" : p.status === "error" ? "failed" : "done ✓";
  d.innerHTML = `<summary><span class="avatar">${member.avatar}</span>
      <span><strong>${esc(member.name)}</strong> · ${esc(member.title)}</span>
      <span class="status">${status}</span></summary>
    <div class="brief"><strong>Brief from Ava:</strong> ${esc(p.task)}</div>
    <div class="bubble${p.status === "working" ? " typing" : ""}">${markdown(p.text)}</div>`;
  return d;
}

form.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const text = input.value.trim();
  if (!text || busy) return;
  input.value = "";

  const employeeId = activeId;
  const chat = (chats[employeeId] ??= []);
  chat.push({ role: "user", text });
  const reply = { role: "assistant", parts: [] };
  chat.push(reply);
  setBusy(true);
  renderMessages();

  const history = chat.slice(0, -1).map((m) => ({
    role: m.role,
    content: m.role === "user" ? m.text : textOfParts(m.parts),
  }));

  // Re-render the live reply at most once per animation frame.
  let pending = false;
  const refresh = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      if (activeId !== employeeId) return;
      const last = messagesEl.lastElementChild;
      const openStates = [...(last?.querySelectorAll("details") ?? [])].map((d) => d.open);
      const fresh = renderMessage(reply, byId[employeeId]);
      fresh.querySelectorAll("details").forEach((d, i) => { if (i < openStates.length) d.open = openStates[i]; });
      last?.replaceWith(fresh);
      const tail = fresh.querySelector(".body > .bubble:last-of-type");
      if (busy && tail && reply.parts.at(-1)?.type === "text") tail.classList.add("typing");
      scrollDown();
    });
  };

  try {
    await streamChat(employeeId, history, (event, data) => {
      if (event === "delta") {
        const last = reply.parts.at(-1);
        if (last?.type === "text") last.text += data.text;
        else reply.parts.push({ type: "text", text: data.text });
      } else if (event === "delegate_start") {
        reply.parts.push({ type: "delegation", callId: data.callId, employeeId: data.employeeId, task: data.task, text: "", status: "working" });
      } else if (event === "delegate_delta") {
        const part = reply.parts.find((p) => p.callId === data.callId);
        if (part) part.text += data.text;
      } else if (event === "delegate_end") {
        const part = reply.parts.find((p) => p.callId === data.callId);
        if (part) {
          part.status = data.error ? "error" : "done";
          if (data.error) part.text += `\n\n⚠️ ${data.error}`;
        }
      } else if (event === "error") {
        reply.error = data.message;
      }
      refresh();
    });
  } catch (err) {
    reply.error = err.message || "Network error";
  }
  setBusy(false);
  saveChats();
  if (activeId === employeeId) renderMessages();
});

async function streamChat(employeeId, messages, onEvent) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ employeeId, messages }),
  });
  if (!res.ok || !res.body) throw new Error(`Server error (${res.status})`);
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    let idx;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const raw = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const event = raw.match(/^event: (.*)$/m)?.[1];
      const data = raw.match(/^data: (.*)$/m)?.[1];
      if (event && data) onEvent(event, JSON.parse(data));
    }
  }
}

input.addEventListener("keydown", (ev) => {
  if (ev.key === "Enter" && !ev.shiftKey) {
    ev.preventDefault();
    form.requestSubmit();
  }
});

$("#clear").addEventListener("click", () => {
  if (busy) return;
  chats[activeId] = [];
  saveChats();
  renderMessages();
});

function setBusy(v) {
  busy = v;
  sendBtn.disabled = v;
  sendBtn.textContent = v ? "Working…" : "Send";
}

function textOfParts(parts) {
  return parts.filter((p) => p.type === "text").map((p) => p.text).join("").trim() || "(no reply)";
}

function scrollDown() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function loadChats() {
  try {
    return JSON.parse(localStorage.getItem("ai-employees-chats")) ?? {};
  } catch {
    return {};
  }
}

function saveChats() {
  try {
    localStorage.setItem("ai-employees-chats", JSON.stringify(chats));
  } catch {
    /* storage unavailable - chats just won't persist */
  }
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

// Small, safe markdown renderer (input is escaped first).
function markdown(src) {
  const lines = esc(src).split("\n");
  const out = [];
  let list = null;
  let inCode = false;
  let code = [];
  let table = [];

  const closeList = () => { if (list) { out.push(`</${list}>`); list = null; } };
  const flushTable = () => {
    if (!table.length) return;
    const rows = table.filter((r) => !/^\|?\s*:?-{2,}/.test(r));
    const cells = (r) => r.replace(/^\||\|$/g, "").split("|").map((c) => inline(c.trim()));
    out.push("<table>" + rows.map((r, i) => {
      const tag = i === 0 ? "th" : "td";
      return "<tr>" + cells(r).map((c) => `<${tag}>${c}</${tag}>`).join("") + "</tr>";
    }).join("") + "</table>");
    table = [];
  };

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCode) { out.push(`<pre><code>${code.join("\n")}</code></pre>`); code = []; inCode = false; }
      else { closeList(); flushTable(); inCode = true; }
      continue;
    }
    if (inCode) { code.push(line); continue; }
    if (/^\s*\|.*\|\s*$/.test(line)) { closeList(); table.push(line.trim()); continue; }
    flushTable();

    let m;
    if ((m = line.match(/^(#{1,4})\s+(.*)$/))) { closeList(); out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`); }
    else if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) { closeList(); out.push("<hr>"); }
    else if ((m = line.match(/^\s*[-*•]\s+(.*)$/))) {
      if (list !== "ul") { closeList(); out.push("<ul>"); list = "ul"; }
      out.push(`<li>${inline(m[1])}</li>`);
    } else if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) {
      if (list !== "ol") { closeList(); out.push("<ol>"); list = "ol"; }
      out.push(`<li>${inline(m[1])}</li>`);
    } else if (!line.trim()) { closeList(); }
    else { closeList(); out.push(`<p>${inline(line)}</p>`); }
  }
  if (inCode) out.push(`<pre><code>${code.join("\n")}</code></pre>`);
  closeList();
  flushTable();
  return out.join("");
}

function inline(s) {
  return s
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");
}
