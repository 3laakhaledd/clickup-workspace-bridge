const logger = require("./utils/logger");

const config = {
  workspaceA: {
    token: process.env.CLICKUP_WORKSPACE_A_TOKEN,
    teamId: process.env.CLICKUP_WORKSPACE_A_TEAM_ID,
    name: process.env.CLICKUP_WORKSPACE_A_NAME || "Workspace A",
  },
  workspaceB: {
    token: process.env.CLICKUP_WORKSPACE_B_TOKEN,
    teamId: process.env.CLICKUP_WORKSPACE_B_TEAM_ID,
    name: process.env.CLICKUP_WORKSPACE_B_NAME || "Workspace B",
  },
  syncDirection: process.env.SYNC_DIRECTION || "bidirectional",
  port: process.env.PORT || 3000,
  webhookSecret: process.env.WEBHOOK_SECRET,
};

function validateConfig() {
  const required = [
    "CLICKUP_WORKSPACE_A_TOKEN",
    "CLICKUP_WORKSPACE_A_TEAM_ID",
    "CLICKUP_WORKSPACE_B_TOKEN",
    "CLICKUP_WORKSPACE_B_TEAM_ID",
  ];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    logger.error(`Missing env vars: ${missing.join(", ")}`);
    process.exit(1);
  }
  logger.info("\u2705 Config validated");
}

module.exports = { config, validateConfig };
