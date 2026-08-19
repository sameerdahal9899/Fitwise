import { api } from "./api";

export async function listWeightEntries(page = 1) {
  const { data } = await api.get("/progress/entries/", { params: { page, page_size: 50 } });
  return data;
}

export async function addWeightEntry(payload) {
  const { data } = await api.post("/progress/entries/", payload);
  return data;
}

export async function deleteWeightEntry(id) {
  await api.delete(`/progress/entries/${id}/`);
}

export async function getProgressSummary() {
  const { data } = await api.get("/progress/summary/");
  return data;
}
