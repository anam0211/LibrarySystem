import { http } from "../../../core/http/client.js";

export const categoryApi = {
  getAll() {
    return http.get("/categories");
  },
  getById(id) {
    return http.get(`/categories/${id}`);
  },
  create(payload) {
    return http.post("/categories", payload);
  },
  update(id, payload) {
    return http.put(`/categories/${id}`, payload);
  },
  remove(id) {
    return http.delete(`/categories/${id}`);
  }
};
