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

export const searchApi = {
  searchBooks(params = {}) {
    return http.get(`/search/books${buildQuery(params)}`);
  },
  suggest(keyword, limit = 8) {
    return http.get(`/search/suggestions${buildQuery({ keyword, limit })}`);
  }
};
