import { API_BASE_URL } from "../../../config/api.js";

async function request(path, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, options);
    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      throw new Error(
        typeof payload === "object" && payload !== null
          ? payload.message || "Media request failed."
          : "Media request failed."
      );
    }

    return typeof payload === "object" && payload !== null && "result" in payload
      ? payload.result
      : payload;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(`Khong the ket noi backend tai ${API_BASE_URL}. Hay kiem tra server backend va CORS upload media.`);
    }

    throw error;
  }
}

export const mediaApi = {
  getAll() {
    return request("/media");
  },
  getByBook(bookId) {
    return request(`/media/books/${bookId}`);
  },
  async upload({ bookId, file, primary }) {
    const formData = new FormData();
    formData.append("file", file);

    return request(`/media/books/${bookId}?primary=${primary ? "true" : "false"}`, {
      method: "POST",
      body: formData
    });
  },
  remove(id) {
    return request(`/media/${id}`, {
      method: "DELETE"
    });
  }
};
