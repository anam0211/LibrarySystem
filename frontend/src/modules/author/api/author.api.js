import { http } from "../../../core/http/client.js";

export const authorApi = {
  getAll() {
    return http.get("/authors");
  },
  getById(id) {
    return http.get(`/authors/${id}`);
  },
  create(payload) {
    return http.post("/authors", payload);
  },
  update(id, payload) {
    return http.put(`/authors/${id}`, payload);
  },
  remove(id) {
    return http.delete(`/authors/${id}`);
  }
};
