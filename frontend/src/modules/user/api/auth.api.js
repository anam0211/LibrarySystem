import { http } from "../../../core/http/client.js";

export const authApi = {
  login(payload) {
    return http.post("/auth/login", payload);
  },
  register(payload) {
    return http.post("/auth/register", payload);
  }
};
