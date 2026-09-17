const axios = require("axios");
const logger = require("./utils/logger");

const BASE_URL = "https://api.clickup.com/api/v2";

class ClickUpClient {
  constructor(token, workspaceName) {
    this.token = token;
    this.name = workspaceName;
    this.http = axios.create({
      baseURL: BASE_URL,
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
    });
  }

  // Tasks
  async getTask(taskId) {
    const { data } = await this.http.get(`/task/${taskId}`);
    return data;
  }

  async createTask(listId, taskData) {
    const { data } = await this.http.post(`/list/${listId}/task`, taskData);
    logger.info(`[${this.name}] Created task "${data.name}" (${data.id})`);
    return data;
  }

  async updateTask(taskId, updates) {
    const { data } = await this.http.put(`/task/${taskId}`, updates);
    logger.info(`[${this.name}] Updated task ${taskId}`);
    return data;
  }

  async getTaskComments(taskId) {
    const { data } = await this.http.get(`/task/${taskId}/comment`);
    return data.comments || [];
  }

  async addComment(taskId, text) {
    const { data } = await this.http.post(`/task/${taskId}/comment`, {
      comment_text: text,
    });
    return data;
  }

  // Lists
  async getList(listId) {
    const { data } = await this.http.get(`/list/${listId}`);
    return data;
  }

  async getListTasks(listId) {
    const { data } = await this.http.get(`/list/${listId}/task`);
    return data.tasks || [];
  }

  // Spaces
  async getSpaces(teamId) {
    const { data } = await this.http.get(`/team/${teamId}/space`);
    return data.spaces || [];
  }

  // Webhooks
  async createWebhook(teamId, endpoint, events) {
    const { data } = await this.http.post(`/team/${teamId}/webhook`, {
      endpoint,
      events,
    });
    logger.info(`[${this.name}] Webhook created: ${data.id}`);
    return data;
  }

  async listWebhooks(teamId) {
    const { data } = await this.http.get(`/team/${teamId}/webhook`);
    return data.webhooks || [];
  }

  async deleteWebhook(webhookId) {
    await this.http.delete(`/webhook/${webhookId}`);
    logger.info(`[${this.name}] Webhook deleted: ${webhookId}`);
  }
}

module.exports = ClickUpClient;
