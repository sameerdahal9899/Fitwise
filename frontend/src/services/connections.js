import { api } from "./api";
import { PERMISSION_FIELDS } from "../utils/constants";

export async function listConnections({ as, status } = {}) {
  const { data } = await api.get("/connections/", { params: { as, status } });
  return data.results;
}

export async function requestConnection(coachId, message = "") {
  const { data } = await api.post("/connections/", { coach: coachId, message });
  return data;
}

export async function acceptConnection(id) {
  const { data } = await api.post(`/connections/${id}/accept/`);
  return data;
}

export async function rejectConnection(id) {
  const { data } = await api.post(`/connections/${id}/reject/`);
  return data;
}

export async function disconnectConnection(id) {
  const { data } = await api.post(`/connections/${id}/disconnect/`);
  return data;
}

export async function getPermissions(connectionId) {
  const { data } = await api.get(`/connections/${connectionId}/permissions/`);
  return data;
}

export async function updatePermissions(connectionId, patch) {
  const { data } = await api.patch(`/connections/${connectionId}/permissions/`, patch);
  return data;
}

export async function getClientData(connectionId) {
  const { data } = await api.get(`/connections/${connectionId}/client-data/`);
  return data;
}

export { PERMISSION_FIELDS };
