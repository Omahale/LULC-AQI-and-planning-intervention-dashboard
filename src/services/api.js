const DEFAULT_BASE_URLS = [
  import.meta.env.VITE_API_BASE_URL,
  "http://localhost:5001",
  "http://localhost:5000",
].filter(Boolean);

const SESSION_KEY = "lulc_aqi_session";
let ACTIVE_BASE_URL = null;

export const authStorage = {
  getToken: () => {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      return session?.token || null;
    } catch {
      return null;
    }
  },
  getUser: () => {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      return session?.user || null;
    } catch {
      return null;
    }
  },
  saveSession: ({ token, user }) => {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        token,
        user,
      })
    );
  },
  clearSession: () => {
    localStorage.removeItem(SESSION_KEY);
  },
};

async function resolveBaseUrl() {
  if (ACTIVE_BASE_URL) {
    return ACTIVE_BASE_URL;
  }

  for (const candidate of DEFAULT_BASE_URLS) {
    try {
      const response = await fetch(`${candidate}/api/health`, { method: "GET" });
      if (response.ok) {
        ACTIVE_BASE_URL = candidate;
        return candidate;
      }
    } catch {
      // continue checking the next port
    }
  }

  ACTIVE_BASE_URL = DEFAULT_BASE_URLS[0] || "http://localhost:5000";
  return ACTIVE_BASE_URL;
}

async function request(path, options = {}) {
  const token = authStorage.getToken();
  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (options.body && !headers["Content-Type"] && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const baseUrl = await resolveBaseUrl();

  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    authStorage.clearSession();
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }

  if (!res.ok) {
    let message = `API error ${res.status} on ${path}`;

    try {
      const errData = await res.json();
      if (errData?.error) {
        message = errData.error;
      }
    } catch {
      // no-op
    }

    throw new Error(message);
  }

  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return res.json();
  }

  return res.text();
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) }),
  del: (path) => request(path, { method: "DELETE" }),
  getBaseUrl: resolveBaseUrl,
  baseUrl: DEFAULT_BASE_URLS[0] || "http://localhost:5000",
};
