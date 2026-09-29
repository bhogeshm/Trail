# AI Employees

A website where you work with a team of AI employees, each powered by Claude:

| Employee | Role | What they do |
|---|---|---|
| 👩‍💼 **Ava** | CEO | Manages everything: understands your goal, breaks it into tasks, delegates to the team and gives you an executive summary |
| 🧠 **Leo** | Marketing & Advertising Strategist | Positioning, audiences/personas, campaign strategy, ad concepts, budget split |
| 📈 **Maya** | Digital Marketing Specialist | SEO, social media, Google/Meta ads, email, content calendars, analytics |
| ✍️ **Sam** | Script Writer | Reels/shorts, YouTube and video ad scripts, radio/podcast spots, ad copy |

You can chat with any employee directly, or brief the **CEO**, who uses a `delegate_task`
tool to hand work to Leo, Maya and Sam (in parallel when possible). You watch each
team member's work stream in live, then Ava wraps it up.

## Run it

Requires Node.js 18+ and an Anthropic API key.

```bash
cd ai-employees
npm install
cp .env.example .env      # then put your key in .env
npm start
```

Open http://localhost:3000.

## Project structure

```
ai-employees/
├── server.js       # Express server + Claude API calls (CEO delegation loop, streaming)
├── employees.js    # The team: names, roles and system prompts - edit to customise
└── public/
    ├── index.html  # Page layout
    ├── styles.css  # Styling (light/dark, mobile friendly)
    └── app.js      # Chat UI, streaming, delegation cards
```

## Customising

- **Change personalities or add an employee:** edit `employees.js`. To let the CEO delegate
  to a new employee, add its id to the `enum` in `delegateTool` in `server.js` and mention
  them in the CEO's system prompt.
- **Model:** `claude-opus-5-5` (set in `server.js`). Server-side refusal fallback is enabled
  (`fallbacks: "default"`), so a request declined by a safety classifier is retried
  automatically on Anthropic's recommended fallback model.
- Chat history is saved in your browser (localStorage); "New chat" clears it.
