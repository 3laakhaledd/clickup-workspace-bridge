# ClickUp Workspace Bridge 🌉

A Node.js server that syncs tasks between two ClickUp workspaces in real-time via webhooks, with manual bulk-sync endpoints.

## Features

- **Real-time sync** via ClickUp webhooks (task create, update, comments)
- **Bidirectional or one-way** sync (configurable)
- **Bulk sync** entire lists between workspaces
- **List mapping** to pair lists across workspaces
- **Loop prevention** to avoid echo syncs
- **Persistent mappings** stored to JSON file

## Quick Start

```bash
# Clone
git clone https://github.com/3laakhaledd/clickup-workspace-bridge.git
cd clickup-workspace-bridge

# Install
npm install

# Configure
cp .env.example .env
# Edit .env with your ClickUp API tokens and team IDs

# Run
npm start
```

## Setup

### 1. Get API tokens

Go to **ClickUp Settings → Apps → API Token** in each workspace. You need a token from each workspace.

### 2. Configure environment

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|----------|-------------|
| `CLICKUP_WORKSPACE_A_TOKEN` | API token for workspace A |
| `CLICKUP_WORKSPACE_A_TEAM_ID` | Team/workspace ID for A |
| `CLICKUP_WORKSPACE_B_TOKEN` | API token for workspace B |
| `CLICKUP_WORKSPACE_B_TEAM_ID` | Team/workspace ID for B |
| `SYNC_DIRECTION` | `bidirectional`, `a-to-b`, or `b-to-a` |

### 3. Map lists

Tell the bridge which lists should sync:

```bash
curl -X POST http://localhost:3000/sync/map-lists \
  -H "Content-Type: application/json" \
  -d '{"listA": "LIST_ID_IN_A", "listB": "LIST_ID_IN_B"}'
```

### 4. Setup webhooks

Once deployed to a public URL:

```bash
curl -X POST http://localhost:3000/sync/setup-webhooks \
  -H "Content-Type: application/json" \
  -d '{"serverUrl": "https://your-server.com"}'
```

### 5. Bulk sync existing tasks

```bash
curl -X POST http://localhost:3000/sync/bulk \
  -H "Content-Type: application/json" \
  -d '{"sourceList": "LIST_ID", "destList": "LIST_ID", "direction": "a-to-b"}'
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/webhooks/workspace-a` | Webhook receiver for workspace A |
| `POST` | `/webhooks/workspace-b` | Webhook receiver for workspace B |
| `POST` | `/sync/map-lists` | Map two lists for syncing |
| `POST` | `/sync/bulk` | Bulk sync a list pair |
| `POST` | `/sync/setup-webhooks` | Register webhooks on both workspaces |
| `GET` | `/sync/mappings` | View current task/list mappings |

## Deployment

Deploy anywhere that runs Node.js and accepts webhooks:

- **Railway** / **Render** / **Fly.io** (recommended, free tiers available)
- **AWS EC2** / **GCP Cloud Run**
- **VPS** with nginx reverse proxy

The server needs a public URL for ClickUp webhooks to reach it.

## Architecture

```
ClickUp Workspace A ──webhook──▶ Bridge Server ──API──▶ ClickUp Workspace B
ClickUp Workspace B ──webhook──▶ Bridge Server ──API──▶ ClickUp Workspace A
```

## License

MIT
