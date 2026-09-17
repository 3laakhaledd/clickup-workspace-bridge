const logger = require("./utils/logger");
const { getMappingStore } = require("./utils/mapping-store");

class SyncEngine {
  constructor(clientA, clientB, direction) {
    this.clientA = clientA;
    this.clientB = clientB;
    this.direction = direction; // bidirectional | a-to-b | b-to-a
    this.mappings = getMappingStore();
    this._syncing = false; // loop guard
  }

  // Map fields from source task to destination payload
  _mapTaskFields(sourceTask) {
    return {
      name: sourceTask.name,
      description: sourceTask.description || "",
      priority: sourceTask.priority ? sourceTask.priority.id : null,
      due_date: sourceTask.due_date || null,
      start_date: sourceTask.start_date || null,
      tags: (sourceTask.tags || []).map((t) => t.name),
    };
  }

  // Handle incoming webhook event
  async handleEvent(source, event) {
    if (this._syncing) return; // prevent echo loops
    this._syncing = true;

    try {
      const { event: eventType, task_id, history_items } = event;

      // Decide direction
      const fromA = source === "a";
      if (fromA && this.direction === "b-to-a") return;
      if (!fromA && this.direction === "a-to-b") return;

      const srcClient = fromA ? this.clientA : this.clientB;
      const dstClient = fromA ? this.clientB : this.clientA;
      const srcLabel = fromA ? "A" : "B";
      const dstLabel = fromA ? "B" : "A";

      switch (eventType) {
        case "taskCreated":
          await this._syncNewTask(srcClient, dstClient, task_id, srcLabel, dstLabel);
          break;
        case "taskUpdated":
          await this._syncTaskUpdate(srcClient, dstClient, task_id, history_items, srcLabel, dstLabel);
          break;
        case "taskCommentPosted":
          await this._syncComment(srcClient, dstClient, task_id, srcLabel, dstLabel);
          break;
        default:
          logger.debug(`Unhandled event: ${eventType}`);
      }
    } catch (err) {
      logger.error(`Sync error: ${err.message}`);
    } finally {
      this._syncing = false;
    }
  }

  async _syncNewTask(srcClient, dstClient, taskId, srcLabel, dstLabel) {
    if (this.mappings.getMirror(taskId)) return;

    const task = await srcClient.getTask(taskId);
    const destListId = this.mappings.getListMapping(task.list.id, srcLabel, dstLabel);
    if (!destListId) {
      logger.warn(`No list mapping for ${srcLabel}:${task.list.id}. Skipping task "${task.name}".`);
      return;
    }

    const payload = this._mapTaskFields(task);
    payload.description = `[Synced from ${srcClient.name} | original: ${taskId}]\n\n${payload.description}`;
    const mirror = await dstClient.createTask(destListId, payload);

    this.mappings.setMirror(taskId, mirror.id);
    logger.info(`Synced new task: ${srcLabel}:${taskId} -> ${dstLabel}:${mirror.id}`);
  }

  async _syncTaskUpdate(srcClient, dstClient, taskId, historyItems, srcLabel, dstLabel) {
    const mirrorId = this.mappings.getMirror(taskId);
    if (!mirrorId) return;

    const task = await srcClient.getTask(taskId);
    const updates = this._mapTaskFields(task);
    await dstClient.updateTask(mirrorId, updates);
    logger.info(`Synced update: ${srcLabel}:${taskId} -> ${dstLabel}:${mirrorId}`);
  }

  async _syncComment(srcClient, dstClient, taskId, srcLabel, dstLabel) {
    const mirrorId = this.mappings.getMirror(taskId);
    if (!mirrorId) return;

    const comments = await srcClient.getTaskComments(taskId);
    if (comments.length === 0) return;
    const latest = comments[comments.length - 1];
    const text = `[${srcClient.name}] ${latest.comment_text || "(attachment)"}`;
    await dstClient.addComment(mirrorId, text);
    logger.info(`Synced comment: ${srcLabel}:${taskId} -> ${dstLabel}:${mirrorId}`);
  }

  // Bulk sync: pull all tasks from a list pair
  async bulkSyncList(srcListId, dstListId, srcClient, dstClient) {
    const tasks = await srcClient.getListTasks(srcListId);
    let created = 0;
    for (const task of tasks) {
      if (this.mappings.getMirror(task.id)) continue;
      const payload = this._mapTaskFields(task);
      payload.description = `[Synced from ${srcClient.name} | original: ${task.id}]\n\n${payload.description}`;
      const mirror = await dstClient.createTask(dstListId, payload);
      this.mappings.setMirror(task.id, mirror.id);
      created++;
    }
    logger.info(`Bulk sync done: ${created}/${tasks.length} tasks from list ${srcListId} -> ${dstListId}`);
    return { total: tasks.length, created };
  }
}

module.exports = SyncEngine;
