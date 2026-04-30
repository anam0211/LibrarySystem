import axios from "axios";
import { readSession } from "./authStore";

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:8080";
export const API_BASE_URL = `${API_ORIGIN}/library/api`;

function extractErrorMessage(error) {
  const fallbackMessage = "Không thể xử lý yêu cầu lúc này.";
  const message =
    error?.response?.data?.message
    || error?.response?.data?.error
    || error?.message
    || fallbackMessage;

  return typeof message === "string" ? message : fallbackMessage;
}

export const apiInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000
});

apiInstance.interceptors.request.use((config) => {
  const session = readSession();

  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }

  return config;
});

apiInstance.interceptors.response.use(
  (response) => {
    const payload = response.data;
    return payload && typeof payload === "object" && "result" in payload ? payload.result : payload;
  },
  (error) => Promise.reject(new Error(extractErrorMessage(error)))
);

export const apiClient = {
  get(url, config) {
    return apiInstance.get(url, config);
  },
  post(url, data, config) {
    return apiInstance.post(url, data, config);
  },
  put(url, data, config) {
    return apiInstance.put(url, data, config);
  },
  delete(url, config) {
    return apiInstance.delete(url, config);
  },
  upload(url, formData, config = {}) {
    return apiInstance.post(url, formData, {
      ...config,
      headers: {
        "Content-Type": "multipart/form-data",
        ...(config.headers || {})
      }
    });
  }
};

export function toAbsoluteMediaUrl(path) {
  if (!path) {
    return "";
  }

  try {
    return new URL(path, `${API_ORIGIN}/`).toString();
  } catch {
    return path;
  }
}
