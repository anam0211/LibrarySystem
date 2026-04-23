import { clearAuthToken, setAuthToken } from "../../http/auth-token.js";
import { authApi } from "../../../modules/user/api/auth.api.js";
import { userApi } from "../../../modules/user/api/user.api.js";
import { circulationApi } from "../../../modules/circulation/api/circulation.api.js";
import { operationReportApi } from "../../../modules/report/api/operation-report.api.js";
import { clone, readStorage, writeStorage } from "../store-utils.js";
import { http } from "../../http/client.js";
const SESSION_STORAGE_KEY = "bookhub-console-session-v4";

function normalizeSession(authResponse) {
  return {
    id: authResponse?.id || 0,
    token: String(authResponse?.token || ""),
    name: authResponse?.fullName || authResponse?.name || "",
    email: authResponse?.email || "",
    role: authResponse?.role || "READER",
    tokenType: authResponse?.type || "Bearer"
  };
}

function normalizeCurrentUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id || 0,
    name: user.fullName || user.name || "",
    email: user.email || "",
    role: user.role || "READER"
  };
}

function normalizeUser(user) {
  return {
    id: Number(user?.id || 0),
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    role: user?.role || "READER",
    status: user?.status || "ACTIVE",
    createdAt: user?.createdAt || ""
  };
}

function createEmptyOperationsOverview() {
  return {
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    adminUsers: 0,
    librarianUsers: 0,
    readerUsers: 0,
    borrowingRecords: 0,
    overdueRecords: 0,
    returnedToday: 0
  };
}

export function attachOperationsStore(cache) {
  let session = readStorage(SESSION_STORAGE_KEY, null);

  if (session?.token) {
    setAuthToken(session.token);
  } else {
    clearAuthToken();
  }

  cache.currentUser = null;
  cache.users = [];
  cache.operationsOverview = createEmptyOperationsOverview();
  cache.recentTransactions = [];
  cache.myHistory = [];

  function persistSession() {
    writeStorage(SESSION_STORAGE_KEY, session);
  }

  return {
    getSession() {
      return clone(session);
    },

    async login(credentials) {
      const authResponse = await authApi.login({
        email: credentials.email,
        password: credentials.password
      });

      session = normalizeSession(authResponse);
      setAuthToken(session.token);
      persistSession();

      try {
        cache.currentUser = normalizeCurrentUser(await userApi.getCurrent());
        session.id = cache.currentUser.id; 
        persistSession();
      } catch {
        cache.currentUser = normalizeCurrentUser(authResponse);
      }

      return clone(session);
    },

    async register(payload) {
      const response = await authApi.register({
        fullName: payload.fullName,
        email: payload.email,
        password: payload.password,
        phone: payload.phone
      });

      if (typeof response === "string") {
        return response;
      }

      return response?.message || "Đăng ký tài khoản thành công.";
    },

    async validateSession() {
      if (!session?.token) {
        return false;
      }

      try {
        await this.loadCurrentUser();
        return true;
      } catch {
        this.logout();
        return false;
      }
    },

    logout() {
      session = null;
      cache.currentUser = null;
      cache.users = [];
      cache.operationsOverview = createEmptyOperationsOverview();
      clearAuthToken();
      persistSession();
    },

    async loadCurrentUser() {
      cache.currentUser = normalizeCurrentUser(await userApi.getCurrent());

      if (session && cache.currentUser) {
        session = {
          ...session,
          id: cache.currentUser.id,
          name: cache.currentUser.name,
          email: cache.currentUser.email,
          role: cache.currentUser.role
        };
        persistSession();
      }

      return cache.currentUser;
    },

    getCurrentUser() {
      return cache.currentUser;
    },

    async loadUsers() {
      const users = await userApi.getAll();
      cache.users = Array.isArray(users) ? users.map(normalizeUser) : [];
      return cache.users;
    },

    getUsers() {
      return cache.users;
    },

    getUserById(userId) {
      return cache.users.find((user) => user.id === Number(userId)) || null;
    },

    async suspendUser(userId) {
      await userApi.suspend(userId);
      await this.loadUsers();
    },

    async removeUser(userId) {
      await userApi.remove(userId);
      await this.loadUsers();
    },

    async loadOperationsOverview() {
      cache.operationsOverview = {
        ...createEmptyOperationsOverview(),
        ...(await operationReportApi.getOverview())
      };
      return cache.operationsOverview;
    },

    getOperationsOverview() {
      return cache.operationsOverview;
    },

    async checkout(payload) {
      const processorId = session?.id || 1; 
      const result = await circulationApi.checkoutBooks(payload, processorId);
      
      await this.loadOperationsOverview();
      await this.loadRecentTransactions();
      return result;
    },

    async returnBook(loanId, bookId) {
      const result = await circulationApi.returnBook(loanId, bookId);
      
      await this.loadOperationsOverview();
      await this.loadRecentTransactions();
      return result;
    },

    async loadRecentTransactions() {
      const data = await circulationApi.getRecentTransactions();
      cache.recentTransactions = Array.isArray(data) ? data : [];
      return cache.recentTransactions;
    },

    getRecentTransactions() {
      return cache.recentTransactions;
    },

    async loadMyHistory() {
      const userId = cache.currentUser?.id || session?.id;
      
      
      if (!userId || userId === 0) {
        return [];
      }
      
      const data = await circulationApi.getMyHistory(userId);
      cache.myHistory = Array.isArray(data) ? data : [];
      return cache.myHistory;
    },

    getMyHistory() {
      return cache.myHistory;
    },

    async reserveBook(payload) {
      const response = await http.post("/circulation/reserve", payload);
      return response;
    },

    async confirmReservation(loanId) {
      const response = await http.put(`/circulation/reservations/${loanId}/confirm`);
      return response;
    },

    async cancelReservation(loanId, reason) {
      const response = await http.put(`/circulation/reservations/${loanId}/cancel`, { reason });
      return response;
    },

    async loadMyNotifications() {
      const userId = cache.currentUser?.id || session?.id;
      if (!userId || userId === 0) {
        return [];
      }

      try {
        const response = await http.get(`/notifications/user/${userId}`);
        
        if (Array.isArray(response)) {
            cache.myNotifications = response;
        } else {
            cache.myNotifications = response?.result || response?.data || [];
        }
      } catch (error) {
        console.error("❌ Lỗi API Thông báo trong Store:", error);
        cache.myNotifications = [];
      }
      
      return cache.myNotifications;
    },

    getMyNotifications() {
      return cache.myNotifications || [];
    },

    async markNotificationAsRead(id) {
      await http.put(`/notifications/${id}/read`);
      await this.loadMyNotifications(); 
    },
  };
}
