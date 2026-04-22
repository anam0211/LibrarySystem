import { http } from "../../../core/http/client.js";

export const circulationApi = {
  /**
   * @param {Object} payload 
   * @param {number} payload.borrowerId 
   * @param {number} payload.dueDays 
   * @param {Array<{bookId: number, qty: number}>} payload.items 
   * @param {number} processorId 
   * @returns {Promise<Object>} 
   */
  checkoutBooks(payload, processorId) {
    return http.post(`/circulation/checkout?processorId=${processorId}`, payload);
  },

  /**
   * @param {number} loanId 
   * @param {number} bookId 
   * @returns {Promise<Object>} 
   */
  returnBook(loanId, bookId) {
    return http.post(`/circulation/return/${loanId}/book/${bookId}`, {});
  },

  getRecentTransactions() {
    return http.get(`/circulation/recent`);
  },

  getMyHistory(userId) {
    return http.get(`/circulation/history/${userId}`);
  },
};