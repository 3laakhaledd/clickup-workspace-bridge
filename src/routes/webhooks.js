const { Router } = require("express");
const logger = require("../utils/logger");
const { config } = require("../config");
const ClickUpClient = require("../clickup-client");
const SyncEngine = require("../sync-engine");

const router = Router();

const clientA = new ClickUpClient(config.workspaceA.token, config.workspaceA.name);
const clientB = new ClickUpClient(config.workspaceB.token, config.workspaceB.name);
const engine = new SyncEngine(clientA, clientB, config.syncDirection);

// Workspace A sends events here
router.post("/workspace-a", async (req, res) => {
  logger.info(`Webhook from ${config.workspaceA.name}: ${req.body.event}`);
  res.sendStatus(200); // ack immediately
  await engine.handleEvent("a", req.body);
});

// Workspace B sends events here
router.post("/workspace-b", async (req, res) => {
  logger.info(`Webhook from ${config.workspaceB.name}: ${req.body.event}`);
  res.sendStatus(200);
  await engine.handleEvent("b", req.body);
});

module.exports = router;
