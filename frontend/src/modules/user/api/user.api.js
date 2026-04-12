import { http } from "../../../core/http/client.js";

export const userApi = {
  getCurrent() {
    return http.get("/users/me");
  },
  getAll() {
    return http.get("/users");
  },
  suspend(id) {
    return http.put(`/users/${id}/suspend`, {});
  },
  remove(id) {
    return http.delete(`/users/${id}`);
  }
};
