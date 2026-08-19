import { api } from "./api";

export async function listConversations() {
  const { data } = await api.get("/messages/conversations/");
  return data.results;
}

export async function getMessages(conversationId, page = 1) {
  const { data } = await api.get(`/messages/conversations/${conversationId}/messages/`, {
    params: { page, page_size: 50 },
  });
  return data;
}

export async function sendMessage(conversationId, content) {
  const { data } = await api.post(`/messages/conversations/${conversationId}/messages/`, { content });
  return data;
}

export async function getUnreadCount() {
  const { data } = await api.get("/messages/unread-count/");
  return data.unread_count;
}
