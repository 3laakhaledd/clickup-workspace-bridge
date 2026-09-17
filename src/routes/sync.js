const { Router } = require("express");
const logger = require("../utils/logger");
const { config } = require("../config");
const ClickUpClient = require("../clickup-client");
const SyncEngine = require("../sync-engine");
const { getMappingStore } = require("../utils/mapping-store");

const router = Router();

const clientA = new ClickUpClient(config.workspaceA.token, config.workspaceA.name);
const clientB = new ClickUpClient(config.workspaceB.token, config.workspaceB.name);
const engine = new SyncEngine(clientA, clientB, config.syncDirection);
const store = getMappingStore();

// Map two lists for syncing
// POST /sync/map-lists { listA: "...", listB: "..." }
router.post("/map-lists", (req, res) => {
  const { listA, listB } = req.body;
  if (!listA || !listB) return res.status(400).json({ error: "listA and listB required" });
  store.setListMapping(listA, listB);
  logger.info(`Mapped lists: A:${listA} <-> B:${listB}`);
  res.json({ ok: true, listA, listB });
});

// Bulk sync: pull all tasks from source list to destination list
// POST /sync/bulk { sourceList: "...", destList: "...", direction: "a-to-b" }
router.post("/bulk", async (req, res) => {
  const { sourceList, destList, direction } = req.body;
  if (!sourceList || !destList || !direction) {
    return res.status(400).json({ error: "sourceList, destList, direction required" });
  }
  const srcClient = direction === "a-to-b" ? clientA : clientB;
  const dstClient = direction === "a-to-b" ? clientB : clientA;
  const result = await engine.bulkSyncList(sourceList, destList, srcClient, dstClient);
  res.json(result);
});

// Setup webhooks on both workspaces
// POST /sync/setup-webhooks { serverUrl: "https://your-server.com" }
router.post("/setup-webhooks", async (req, res) => {
  const { serverUrl } = req.body;
  if (!serverUrl) return res.status(400).json({ error: "serverUrl required" });

  const events = [
    "taskCreated",
    "taskUpdated",
    "taskDeleted",
    "taskStatusUpdated",
    "taskCommentPosted",
  ];

  try {
    const whA = await clientA.createWebhook(
      config.workspaceA.teamId,
      `${serverUrl}/webhooks/workspace-a`,
      events
    );
    const whB = await clientB.createWebhook(
      config.workspaceB.teamId,
      `${serverUrl}/webhooks/workspace-b`,
      events
    );
    res.json({ webhookA: whA.id, webhookB: whB.id });
  } catch (err) {
    logger.error(`Webhook setup failed: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// View current mappings
router.get("/mappings", (req, res) => {
  res.json({
    taskMirrors: store.taskMirrors,
    listMappings: store.listMappings,
  });
});

module.exports = router;
