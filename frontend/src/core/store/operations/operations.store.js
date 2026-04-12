import { clearAuthToken, setAuthToken } from "../../http/auth-token.js";
import { authApi } from "../../../modules/user/api/auth.api.js";
import { userApi } from "../../../modules/user/api/user.api.js";
import { operationReportApi } from "../../../modules/report/api/operation-report.api.js";
import { clone, readStorage, writeStorage } from "../store-utils.js";

const SESSION_STORAGE_KEY = "bookhub-console-session-v4";

function normalizeSession(authResponse) {
  return {
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
    }
  };
}
