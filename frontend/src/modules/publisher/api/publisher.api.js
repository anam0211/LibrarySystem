import { http } from "../../../core/http/client.js";

export const publisherApi = {
  getAll() {
    return http.get("/publishers");
  },
  getById(id) {
    return http.get(`/publishers/${id}`);
  },
  create(payload) {
    return http.post("/publishers", payload);
  },
  update(id, payload) {
    return http.put(`/publishers/${id}`, payload);
  },
  remove(id) {
    return http.delete(`/publishers/${id}`);
  }
};
