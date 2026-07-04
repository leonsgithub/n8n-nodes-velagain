# Velagain verified-node demo video — script

n8n wants ONE continuous take (no cuts), ≤5 min, proper screen recorder (Loom).
Optional voiceover. Follow n8n's five steps in order — this maps each one.

**Record version `0.1.3`** (it's what you submit — it adds AI-tool support).

## Before you hit record (setup, off-camera)
- A Velagain **API key**: portal → Settings → API Keys → create, copy the secret.
- Your **staging API base URL**, e.g. `https://<staging-host>/api/v1` (the credential `baseUrl`).
- Start n8n locally: `docker compose up` (this folder). Open http://localhost:5678,
  create the owner account. The compose already sets
  `N8N_COMMUNITY_PACKAGES_ENABLED=true` and
  `N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE=true` (needed for step 5) and runs with
  `--tunnel` (public webhook URL for the trigger).
- For step 5 you also need an **LLM credential** (OpenAI/Anthropic/etc.) for the AI Agent.

Have the API key + staging URL on your clipboard so the recording flows.

---

## The take (start recording here)

### Step 1 — Install from npm (the submitted version)
Settings → **Community Nodes** → **Install** → enter `n8n-nodes-velagain` →
(optionally pin version `0.1.3`) → Install. Show it installs successfully.

### Step 2 — New workflow + insert the node
New workflow → **+** → search "Velagain" → add the **Velagain** node.

### Step 3 — Credential + working credential test
On the node, create a new **Velagain API** credential:
- Base URL = your staging API base
- API Key = the key from setup

Click **Test** → show the green "connection successful" (it calls `/auth/whoami`).
Keep the key out of frame when possible.

### Step 4 — Most common actions
Do one or two real actions, showing output JSON:
- **Booking → Create**: pick a Customer ID, Start Time (use the Service dropdown —
  it loads live from your account), Execute → show the created booking.
- (optional) **Customer → Create**: display name + email → Execute → show result.
Mention the **Idempotency Key** field (retry-safe). If you want the trigger too:
add a **Velagain Trigger** (Booking Created), Activate, create a booking in the
portal, show the run firing with the `{id,type,created_at,tenant_id,data}` envelope,
then Deactivate (it cleans up the subscription).

### Step 5 — Use as an AI-agent tool (app node ⇒ required)
- Add an **AI Agent** node; attach your **LLM** credential (Chat Model).
- On the Agent, add a **tool** → choose the **Velagain** node (it's tool-enabled
  via `usableAsTool` + the instance flag). Set it to e.g. **Customer → Create**.
- Give the Agent a prompt like: *"Create a customer named Jane Doe with email
  jane@example.com in Velagain."* → Execute → show the Agent calling the Velagain
  tool and the customer being created. (One tool action is enough.)

Stop recording. Upload to Loom, share the link with n8n.

---

## Tips
- No cuts — if you fumble, restart the take.
- The **action** path (steps 2–4 create, and step 5 tool) needs only outbound
  network. The **trigger** needs the tunnel; if it's flaky, the action + tool
  demo alone satisfies steps 1–5.
- Files here: `docker-compose.yml`, `workflow-action-demo.json`,
  `workflow-trigger-demo.json` (import via ⋮ → Import from File; re-select your
  credential after import).
