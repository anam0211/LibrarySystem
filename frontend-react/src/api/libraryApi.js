import { apiClient } from "./apiClient";

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

export const libraryApi = {
  auth: {
    login: (payload) => apiClient.post("/auth/login", payload),
    register: (payload) => apiClient.post("/auth/register", payload)
  },
  users: {
    me: () => apiClient.get("/users/me"),
    list: () => apiClient.get("/users"),
    myKyc: () => apiClient.get("/v1/users/me/kyc"),
    submitKyc: (payload) => apiClient.post("/v1/users/me/kyc", payload),
    updateKyc: (payload) => apiClient.put("/v1/users/me/kyc", payload),
    kycUsers: () => apiClient.get("/v1/admin/users/kyc"),
    pendingKyc: () => apiClient.get("/v1/admin/users/pending-kyc"),
    approveKyc: (id) => apiClient.post(`/v1/admin/users/${id}/approve-kyc`, {}),
    rejectKyc: (id) => apiClient.post(`/v1/admin/users/${id}/reject-kyc`, {}),
    cancelVerification: () => apiClient.put("/v1/users/me/kyc/cancel", {}),
    suspend: (id) => apiClient.put(`/users/${id}/suspend`, {}),
    activate: (id) => apiClient.put(`/users/${id}/activate`, {}),
    update: (id, payload) => apiClient.put(`/users/${id}`, payload),
    remove: (id) => apiClient.delete(`/users/${id}`)
  },
  authors: {
    list: () => apiClient.get("/authors"),
    get: (id) => apiClient.get(`/authors/${id}`),
    create: (payload) => apiClient.post("/authors", payload),
    update: (id, payload) => apiClient.put(`/authors/${id}`, payload),
    remove: (id) => apiClient.delete(`/authors/${id}`)
  },
  categories: {
    list: () => apiClient.get("/categories"),
    get: (id) => apiClient.get(`/categories/${id}`),
    create: (payload) => apiClient.post("/categories", payload),
    update: (id, payload) => apiClient.put(`/categories/${id}`, payload),
    remove: (id) => apiClient.delete(`/categories/${id}`)
  },
  publishers: {
    list: () => apiClient.get("/publishers"),
    get: (id) => apiClient.get(`/publishers/${id}`),
    create: (payload) => apiClient.post("/publishers", payload),
    update: (id, payload) => apiClient.put(`/publishers/${id}`, payload),
    remove: (id) => apiClient.delete(`/publishers/${id}`)
  },
  books: {
    list: (params) => apiClient.get(`/books${buildQuery(params)}`),
    get: (id) => apiClient.get(`/books/${id}`),
    newest: (limit = 8) => apiClient.get(`/books/newest${buildQuery({ limit })}`),
    featured: (limit = 8) => apiClient.get(`/books/featured${buildQuery({ limit })}`),
    create: (payload) => apiClient.post("/books", payload),
    update: (id, payload) => apiClient.put(`/books/${id}`, payload),
    remove: (id) => apiClient.delete(`/books/${id}`)
  },
  media: {
    list: () => apiClient.get("/media"),
    byBook: (bookId) => apiClient.get(`/media/books/${bookId}`),
    upload: (bookId, file, primary = false) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiClient.upload(`/media/books/${bookId}?primary=${primary}`, formData);
    },
    remove: (id) => apiClient.delete(`/media/${id}`)
  },
  reports: {
    catalogOverview: () => apiClient.get("/reports/catalog/overview"),
    operationsOverview: () => apiClient.get("/reports/operations/overview")
  },
  search: {
    books: (params) => apiClient.get(`/search/books${buildQuery(params)}`),
    suggestions: (keyword, limit = 8) =>
      apiClient.get(`/search/suggestions${buildQuery({ keyword, limit })}`)
  },
  circulation: {
    checkout: (payload, processorId) =>
      apiClient.post(`/circulation/checkout${buildQuery({ processorId })}`, payload),
    checkoutOnline: (borrowerId, payload) => apiClient.post(`/circulation/checkout-online/${borrowerId}`, payload),
    returnBook: (loanId, bookId) => apiClient.post(`/circulation/return/${loanId}/book/${bookId}`, {}),
    recent: () => apiClient.get("/circulation/recent"),
    history: (userId) => apiClient.get(`/circulation/history/${userId}`),
    reserve: (payload) => apiClient.post("/circulation/reserve", payload),
    pendingReservations: () => apiClient.get("/circulation/reservations/pending"),
    confirmReservation: (id) => apiClient.put(`/circulation/reservations/${id}/confirm`, {}),
    cancelReservation: (id, reason) =>
      apiClient.put(`/circulation/reservations/${id}/cancel`, { reason }),
    updateStatus: (id, status) => apiClient.put(`/circulation/${id}/status`, { status })
  },
  loans: {
    requestReturn: (id) => apiClient.post(`/v1/loans/${id}/request-return`, {}),
    updateAdminStatus: (id, status, trackingCode = "") =>
      apiClient.put(`/v1/admin/loans/${id}/status`, { newStatus: status, trackingCode })
  },
  cart: {
    list: (userId) => apiClient.get(`/cart/users/${userId}`),
    addBook: (userId, bookId) => apiClient.post(`/cart/users/${userId}/books/${bookId}`, {}),
    removeBook: (userId, bookId) => apiClient.delete(`/cart/users/${userId}/books/${bookId}`),
    clear: (userId) => apiClient.delete(`/cart/users/${userId}`)
  },
  wishlists: {
    list: (userId) => apiClient.get(`/wishlists/users/${userId}`),
    toggle: (userId, bookId) => apiClient.post(`/wishlists/users/${userId}/books/${bookId}/toggle`, {})
  },
  reviews: {
    listAll: () => apiClient.get("/reviews"),
    setHidden: (id, hidden) => apiClient.put(`/reviews/${id}/hidden`, { hidden }),
    byBook: (bookId) => apiClient.get(`/books/${bookId}/reviews`),
    create: (bookId, payload) => apiClient.post(`/books/${bookId}/reviews`, payload)
  },
  fines: {
    list: () => apiClient.get("/fines"),
    byUser: (userId) => apiClient.get(`/fines/users/${userId}`),
    unpaid: () => apiClient.get("/fines/unpaid"),
    create: (payload) => apiClient.post("/fines", payload),
    markPaid: (id) => apiClient.put(`/fines/${id}/paid`, {})
  },
  addresses: {
    byUser: (userId) => apiClient.get(`/user-addresses/users/${userId}`),
    save: (userId, payload) => apiClient.post(`/user-addresses/users/${userId}`, payload),
    remove: (id) => apiClient.delete(`/user-addresses/${id}`)
  },
  systemConfigs: {
    list: () => apiClient.get("/system-configs"),
    upsert: (key, payload) => apiClient.put(`/system-configs/${key}`, payload)
  },
  notifications: {
    list: (userId) => apiClient.get(`/notifications/user/${userId}`),
    unread: (userId) => apiClient.get(`/notifications/user/${userId}/unread`),
    markAsRead: (id) => apiClient.put(`/notifications/${id}/read`, {})
  }
};
