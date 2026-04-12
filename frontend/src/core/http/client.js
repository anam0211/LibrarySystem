import { API_BASE_URL, DEFAULT_HEADERS } from "../../config/api.js";
import { getAuthorizationHeaders } from "./auth-token.js";

async function request(path, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: getAuthorizationHeaders({
        ...DEFAULT_HEADERS,
        ...(options.headers || {})
      })
    });

    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const error = new Error(
        typeof payload === "object" && payload !== null
          ? payload.message || `Request failed with status ${response.status}`
          : `Request failed with status ${response.status}`
      );

      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    if (typeof payload === "object" && payload !== null && "result" in payload) {
      return payload.result;
    }

    return payload;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(`Không thể kết nối backend tại ${API_BASE_URL}. Hãy kiểm tra server và API_BASE_URL.`);
    }

    throw error;
  }
}

export const http = {
  get(path, options) {
    return request(path, { ...options, method: "GET" });
  },
  post(path, body, options) {
    return request(path, {
      ...options,
      method: "POST",
      body: JSON.stringify(body)
    });
  },
  put(path, body, options) {
    return request(path, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body)
    });
  },
  delete(path, options) {
    return request(path, { ...options, method: "DELETE" });
  }
};
