const fs = require("fs");
const path = require("path");
const logger = require("./logger");

const STORE_PATH = path.join(__dirname, "../../data/mappings.json");

class MappingStore {
  constructor() {
    this.taskMirrors = {}; // sourceTaskId -> mirrorTaskId
    this.listMappings = {}; // "A:listId" -> "B:listId"
    this._load();
  }

  // Task mirror: bidirectional lookup
  setMirror(idA, idB) {
    this.taskMirrors[idA] = idB;
    this.taskMirrors[idB] = idA;
    this._save();
  }

  getMirror(taskId) {
    return this.taskMirrors[taskId] || null;
  }

  // List mapping: workspace-prefixed
  setListMapping(listIdA, listIdB) {
    this.listMappings[`A:${listIdA}`] = listIdB;
    this.listMappings[`B:${listIdB}`] = listIdA;
    this._save();
  }

  getListMapping(listId, srcLabel, dstLabel) {
    return this.listMappings[`${srcLabel}:${listId}`] || null;
  }

  // Persistence
  _load() {
    try {
      if (fs.existsSync(STORE_PATH)) {
        const raw = JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
        this.taskMirrors = raw.taskMirrors || {};
        this.listMappings = raw.listMappings || {};
        logger.info(`Loaded ${Object.keys(this.taskMirrors).length / 2} task mappings`);
      }
    } catch {
      logger.warn("No existing mappings found, starting fresh");
    }
  }

  _save() {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      STORE_PATH,
      JSON.stringify(
        { taskMirrors: this.taskMirrors, listMappings: this.listMappings },
        null,
        2
      )
    );
  }
}

let instance;
function getMappingStore() {
  if (!instance) instance = new MappingStore();
  return instance;
}

module.exports = { getMappingStore };
