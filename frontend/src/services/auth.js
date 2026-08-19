import { api, tokenStore } from "./api";

export async function register(payload) {
  const { data } = await api.post("/auth/register/", payload);
  return data;
}

export async function login(email, password) {
  const { data } = await api.post("/auth/login/", { email, password });
  tokenStore.set(data.access, data.refresh);
  return data.user;
}

export async function logout() {
  const refresh = tokenStore.getRefresh();
  try {
    if (refresh) await api.post("/auth/logout/", { refresh });
  } finally {
    tokenStore.clear();
  }
}

export async function fetchCurrentUser() {
  const { data } = await api.get("/auth/me/");
  return data;
}

export async function updateAccount(payload) {
  const { data } = await api.patch("/users/me/", payload);
  return data;
}

export async function changePassword(payload) {
  const { data } = await api.post("/users/change-password/", payload);
  return data;
}
