import {
  usersMeta,
  createUsersPageState,
  renderUsersPage,
  bindUsersPage
} from "../../modules/user/pages/users.page.js";
import { circulationMeta, renderCirculationPage, bindCirculationPage} from "../../modules/circulation/pages/circulation.page.js";
import { notificationsMeta, renderNotificationsPage } from "../../modules/notification/pages/notifications.page.js";
import { operationsMeta, renderOperationsPage } from "../../modules/report/pages/operations.page.js";

export const operationsPagePaths = {
  users: "/users",
  circulation: "/circulation",
  notifications: "/notifications",
  operations: "/operations"
};

export const operationsPageRegistry = {
  users: {
    meta: usersMeta,
    createState: createUsersPageState,
    render: (store, state) => renderUsersPage(store, state),
    bind: bindUsersPage,
    load: async (store) => {
      await Promise.all([store.loadCurrentUser(), store.loadUsers()]);
    }
  },
  circulation: {
    meta: circulationMeta,
    render: (store) => renderCirculationPage(store),
    bind: bindCirculationPage,
    load: async (store) => {
      await store.loadRecentTransactions(); 
    }
  },
  notifications: {
    meta: notificationsMeta,
    render: () => renderNotificationsPage()
  },
  operations: {
    meta: operationsMeta,
    render: (store) => renderOperationsPage(store),
    load: async (store) => {
      await store.loadOperationsOverview();
    }
  }
};
