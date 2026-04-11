import { http } from "../../../core/http/client.js";

export const catalogReportApi = {
  getOverview() {
    return http.get("/reports/catalog/overview");
  }
};
