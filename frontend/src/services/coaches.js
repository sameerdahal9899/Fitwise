import { api } from "./api";

export async function getMyApplication() {
  try {
    const { data } = await api.get("/coaches/apply/");
    return data;
  } catch (error) {
    if (error.response?.status === 404) return null;
    throw error;
  }
}

export async function submitApplication(payload) {
  const { data } = await api.post("/coaches/apply/", payload);
  return data;
}

export async function searchDirectory({ search = "", specialization = "" } = {}) {
  const { data } = await api.get("/coaches/directory/", { params: { search, specialization } });
  return data.results;
}

export async function getCoachProfile(id) {
  const { data } = await api.get(`/coaches/directory/${id}/`);
  return data;
}

export async function getMyCoachProfile() {
  try {
    const { data } = await api.get("/coaches/profile/");
    return data;
  } catch (error) {
    if (error.response?.status === 404) return null;
    throw error;
  }
}

export async function updateMyCoachProfile(payload) {
  const { data } = await api.patch("/coaches/profile/", payload);
  return data;
}
