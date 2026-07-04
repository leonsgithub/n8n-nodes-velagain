# n8n-nodes-velagain

An [n8n](https://n8n.io) community node for [Velagain](https://velagain.com) — automate
bookings and customers on the Velagain booking platform with triggers and actions, no code.

## Installation

Community node (self-hosted n8n):

```
Settings → Community Nodes → Install → n8n-nodes-velagain
```

Or via npm in your n8n instance:

```bash
npm install n8n-nodes-velagain
```

## Credentials

Create an API key in the Velagain customer portal under **Settings → API Keys**, then in n8n
add a **Velagain API** credential:

| Field | Value |
|-------|-------|
| Base URL | Your Velagain API root, e.g. `https://api.velagain.com/api/v1` (override for self-hosted / staging) |
| API Key | The key you created in the portal (shown once — copy it then) |

Click **Test** — it calls `GET /auth/whoami` and should return your tenant identity.

## Nodes

### Velagain Trigger

Starts a workflow when a Velagain event fires. On activation the node creates a webhook
subscription (`POST /management/webhooks`) and stores its id; on deactivation it deletes the
subscription (`DELETE /management/webhooks/{id}`) so no orphans are left behind.

Events: `booking.created`, `booking.cancelled`, `booking.rescheduled`, `booking.rejected`,
`booking.ready`, `booking.completed`, `payment.created`, `tenant.updated`.

**Signature verification (optional):** enable **Verify Signature** and supply the shared
secret. Deliveries whose `X-Hub-Signature: sha256=<hmac>` header does not match are rejected.

Delivered payloads use the envelope:

```json
{
  "id": "<event id>",
  "type": "booking.created",
  "created_at": "2026-07-04T10:00:00Z",
  "tenant_id": "<tenant>",
  "data": { "...the raw event payload..." }
}
```

### Velagain (action)

| Resource | Operations |
|----------|-----------|
| Booking | Create, Cancel, Reschedule, Get |
| Customer | Create, Find |

Booking **Create** supports Service / Resource / Staff dropdowns (loaded from your account) and
an **Idempotency Key** so retried steps never create a duplicate booking.

## Example workflow

**New booking → notify your team**

1. **Velagain Trigger** — Event: `Booking Created`. Activate the workflow; Velagain subscribes
   the trigger's webhook URL.
2. **IF / Set** — shape `{{$json.data}}` into a message.
3. **Slack / LINE / Email** — send the notification.

When a booking is created in Velagain, the trigger fires within seconds and the workflow runs.

## Resources

- [Velagain API docs](https://velagain.com/docs/api)
- [n8n community nodes docs](https://docs.n8n.io/integrations/community-nodes/)

## License

MIT
