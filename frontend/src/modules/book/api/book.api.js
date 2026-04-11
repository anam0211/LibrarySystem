import { http } from "../../../core/http/client.js";

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export const bookApi = {
  getAll(params = {}) {
    return http.get(`/books${buildQuery(params)}`);
  },
  getById(id) {
    return http.get(`/books/${id}`);
  },
  getNewest(limit = 6) {
    return http.get(`/books/newest${buildQuery({ limit })}`);
  },
  getFeatured(limit = 6) {
    return http.get(`/books/featured${buildQuery({ limit })}`);
  },
  create(payload) {
    return http.post("/books", payload);
  },
  update(id, payload) {
    return http.put(`/books/${id}`, payload);
  },
  remove(id) {
    return http.delete(`/books/${id}`);
  }
};
