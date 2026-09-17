require("dotenv").config();
const express = require("express");
const logger = require("./utils/logger");
const webhookRouter = require("./routes/webhooks");
const syncRouter = require("./routes/sync");
const { validateConfig } = require("./config");

const app = express();
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// Webhook endpoints (ClickUp sends events here)
app.use("/webhooks", webhookRouter);

// Manual sync endpoints
app.use("/sync", syncRouter);

const PORT = process.env.PORT || 3000;

async function start() {
  validateConfig();
  app.listen(PORT, () => {
    logger.info(`\uD83D\uDE80 ClickUp Workspace Bridge running on port ${PORT}`);
    logger.info(
      `   ${process.env.CLICKUP_WORKSPACE_A_NAME || "Workspace A"} \u21C4 ${process.env.CLICKUP_WORKSPACE_B_NAME || "Workspace B"}`
    );
  });
}

start().catch((err) => {
  logger.error("Failed to start server", err);
  process.exit(1);
});
