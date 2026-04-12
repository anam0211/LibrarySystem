import { http } from "../../../core/http/client.js";

export const operationReportApi = {
  getOverview() {
    return http.get("/reports/operations/overview");
  }
};
