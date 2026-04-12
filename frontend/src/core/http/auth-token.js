const AUTH_TOKEN_STORAGE_KEY = "bookhub-console-token-v1";

let authToken = "";

if (typeof window !== "undefined") {
  authToken = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || "";
}

export function getAuthToken() {
  return authToken;
}

export function setAuthToken(token) {
  authToken = String(token || "").trim();

  if (typeof window === "undefined") {
    return;
  }

  if (authToken) {
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, authToken);
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

export function clearAuthToken() {
  setAuthToken("");
}

export function getAuthorizationHeaders(headers = {}) {
  if (!authToken) {
    return { ...headers };
  }

  return {
    ...headers,
    Authorization: `Bearer ${authToken}`
  };
}
