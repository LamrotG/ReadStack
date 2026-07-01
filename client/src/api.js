const BASE = import.meta.env.VITE_API_URL;

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: "include",
    headers: body !== undefined ? { "Content-Type": "application/json" } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.error ?? "request_failed"), { status: res.status, data });
  return data;
}

const get  = (path)        => request("GET",    path);
const post = (path, body)  => request("POST",   path, body);
const patch = (path, body) => request("PATCH",  path, body);
const del  = (path)        => request("DELETE", path);

export const auth = {
  signup:         (email, password)        => post("/api/auth/signup", { email, password }),
  login:          (identifier, password)   => post("/api/auth/login",  { identifier, password }),
  forgotPassword: (email)               => post("/api/auth/forgot-password", { email }),
  resetPassword:  (token, password)     => post("/api/auth/reset-password",  { token, password }),
  me:             ()                    => get("/api/auth/me"),
  updateProfile:  (body)                => patch("/api/auth/profile", body),
  changePassword: (current, next)       => patch("/api/auth/password", { current_password: current, new_password: next }),
  logout:         ()                    => post("/api/auth/logout"),
};

export const items = {
  list:         (status)      => get(`/api/items${status ? `?status=${status}` : ""}`),
  create:       (body)        => post("/api/items", body),
  update:       (id, body)    => patch(`/api/items/${id}`, body),
  remove:       (id)          => del(`/api/items/${id}`),
  setGoal:      (id, body)    => post(`/api/items/${id}/goal`, body),
  progress:     (id)          => get(`/api/items/${id}/progress`),
  reviews:      (id)          => get(`/api/items/${id}/reviews`),
  addReview:    (id, body)    => post(`/api/items/${id}/reviews`, body),
  linkMetadata: (url)         => get(`/api/items/link-metadata?url=${encodeURIComponent(url)}`),
};

export const goals = {
  getOverall:    ()     => get("/api/goals/overall"),
  updateOverall: (days) => patch("/api/goals/overall", { overall_goal_days_per_week: days }),
};

export const checkins = {
  create: (body)         => post("/api/checkins", body),
  list:   (from, to)     => get(`/api/checkins?from=${from}&to=${to}`),
};
