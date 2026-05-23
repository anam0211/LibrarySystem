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
    updateMe: (payload) => apiClient.put("/users/me", payload),
    changeMyPassword: (payload) => apiClient.put("/users/me/password", payload),
    list: () => apiClient.get("/users"),
    myKyc: () => apiClient.get("/v1/users/me/kyc"),
    submitKyc: (payload) => apiClient.post("/v1/users/me/kyc", payload),
    updateKyc: (payload) => apiClient.put("/v1/users/me/kyc", payload),
    kycUsers: () => apiClient.get("/v1/admin/users/kyc"),
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
    featured: (limit = 8) => apiClient.get(`/books/featured${buildQuery({ limit })}`),
    leaderboards: (limit = 6) => apiClient.get(`/books/leaderboards${buildQuery({ limit })}`),
    create: (payload) => apiClient.post("/books", payload),
    update: (id, payload) => apiClient.put(`/books/${id}`, payload),
    remove: (id) => apiClient.delete(`/books/${id}`)
  },
  bookCopies: {
    byBook: (bookId) => apiClient.get(`/book-copies/books/${bookId}`),
    create: (bookId, payload) => apiClient.post(`/book-copies/books/${bookId}`, payload),
    update: (copyId, payload) => apiClient.put(`/book-copies/${copyId}`, payload),
    remove: (copyId) => apiClient.delete(`/book-copies/${copyId}`)
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
    books: (params) => apiClient.get(`/search/books${buildQuery(params)}`)
  },
  circulation: {
    recent: () => apiClient.get("/circulation/recent"),
    myHistory: () => apiClient.get("/circulation/history/me")
  },
  loans: {
    kanban: () => apiClient.get("/v1/admin/loans/kanban"),
    checkout: (payload) => apiClient.post("/v1/loans/checkout", payload),
    requestReturn: (id) => apiClient.post(`/v1/loans/${id}/request-return`, {}),
    confirmReturn: (id, payload) => apiClient.post(`/v1/admin/loans/${id}/confirm-return`, payload),
    sendReturnReminder: (id) => apiClient.post(`/v1/admin/loans/${id}/return-reminder`, {}),
    updateAdminStatus: (id, status, trackingCode = "") =>
      apiClient.put(`/v1/admin/loans/${id}/status`, { newStatus: status, trackingCode })
  },
  cart: {
    me: () => apiClient.get("/cart/me"),
    addMyBook: (bookId) => apiClient.post(`/cart/me/books/${bookId}`, {}),
    updateMyQuantity: (bookId, quantity) => apiClient.put(`/cart/me/books/${bookId}/quantity`, { quantity }),
    removeMyBook: (bookId) => apiClient.delete(`/cart/me/books/${bookId}`),
    clearMine: () => apiClient.delete("/cart/me")
  },
  wishlists: {
    me: () => apiClient.get("/wishlists/me"),
    toggleMine: (bookId) => apiClient.post(`/wishlists/me/books/${bookId}/toggle`, {})
  },
  reviews: {
    listAll: () => apiClient.get("/reviews"),
    setHidden: (id, hidden) => apiClient.put(`/reviews/${id}/hidden`, { hidden }),
    byBook: (bookId) => apiClient.get(`/books/${bookId}/reviews`),
    mine: (bookId) => apiClient.get(`/books/${bookId}/reviews/me`),
    create: (bookId, payload) => apiClient.post(`/books/${bookId}/reviews`, payload),
    updateMine: (bookId, payload) => apiClient.put(`/books/${bookId}/reviews/me`, payload)
  },
  fines: {
    mine: () => apiClient.get("/fines/me"),
    list: () => apiClient.get("/fines"),
    create: (payload) => apiClient.post("/fines", payload),
    markPaid: (id) => apiClient.put(`/fines/${id}/paid`, {})
  },
  notifications: {
    mine: () => apiClient.get("/notifications/me"),
    myUnread: () => apiClient.get("/notifications/me/unread"),
    markMineAsRead: (id) => apiClient.put(`/notifications/me/${id}/read`, {})
  },
  payments: {
    createPremiumVnpay: (membershipId) =>
      apiClient.post(`/payments/vnpay/memberships/checkout${buildQuery({ membershipId })}`, {}),
    createFineVnpay: (fineId) => apiClient.post(`/payments/vnpay/fines/${fineId}`, {})
  }
};
