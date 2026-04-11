import { createAppStore } from "../core/store/app-store.js";
import { renderLoginShell, renderAppShell, renderPublicShell } from "../shared/layout/app-shell.js";
import { renderLoginPage, bindLoginPage } from "../modules/user/pages/login.page.js";
import {
  homeMeta,
  createHomePageState,
  renderHomePage,
  renderHomeNavbarToolbar,
  bindHomePage
} from "../modules/public/pages/home.page.js";
import {
  bookDetailMeta,
  createBookDetailPageState,
  renderBookDetailPage
} from "../modules/public/pages/book-detail.page.js";
import { readerMeta, renderReaderPage } from "../modules/public/pages/reader.page.js";
import { dashboardMeta, renderDashboardPage, bindDashboardPage } from "../modules/dashboard/pages/dashboard.page.js";
import {
  booksMeta,
  createBooksPageState,
  renderBooksPage,
  bindBooksPage
} from "../modules/book/pages/book.page.js";
import {
  authorsMeta,
  createAuthorsPageState,
  renderAuthorsPage,
  bindAuthorsPage
} from "../modules/author/pages/author.page.js";
import {
  categoriesMeta,
  createCategoriesPageState,
  renderCategoriesPage,
  bindCategoriesPage
} from "../modules/category/pages/category.page.js";
import {
  publishersMeta,
  createPublishersPageState,
  renderPublishersPage,
  bindPublishersPage
} from "../modules/publisher/pages/publisher.page.js";
import {
  searchMeta,
  createSearchPageState,
  renderSearchPage,
  bindSearchPage
} from "../modules/search/pages/search.page.js";
import {
  mediaMeta,
  createMediaPageState,
  renderMediaPage,
  bindMediaPage
} from "../modules/media/pages/media.page.js";
import { usersMeta, renderUsersPage } from "../modules/user/pages/users.page.js";
import { circulationMeta, renderCirculationPage } from "../modules/circulation/pages/circulation.page.js";
import { notificationsMeta, renderNotificationsPage } from "../modules/notification/pages/notifications.page.js";
import { operationsMeta, renderOperationsPage } from "../modules/report/pages/operations.page.js";

const DEFAULT_PUBLIC_PAGE = "home";
const DEFAULT_ADMIN_PAGE = "dashboard";
const PUBLIC_PAGE_KEYS = new Set(["home", "reader", "bookDetail"]);
const PAGE_PATHS = {
  home: "/",
  bookDetail: "/book",
  reader: "/reader",
  login: "/login",
  dashboard: "/dashboard",
  books: "/books",
  authors: "/authors",
  categories: "/categories",
  publishers: "/publishers",
  search: "/search",
  media: "/media",
  users: "/users",
  circulation: "/circulation",
  notifications: "/notifications",
  operations: "/operations"
};
const PATH_TO_PAGE = Object.fromEntries(
  Object.entries(PAGE_PATHS).map(([pageKey, path]) => [path, pageKey])
);

PATH_TO_PAGE["/home"] = "home";

function escapeNotificationHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function resolveNotificationVariant(message) {
  const normalizedMessage = String(message || "").trim().toLowerCase();

  if (!normalizedMessage) {
    return "info";
  }

  if (
    normalizedMessage.includes("thanh cong")
    || normalizedMessage.includes("thành công")
    || normalizedMessage.includes("da tai")
    || normalizedMessage.includes("đã tải")
    || normalizedMessage.includes("da luu")
    || normalizedMessage.includes("đã lưu")
  ) {
    return "success";
  }

  if (
    normalizedMessage.includes("khong the")
    || normalizedMessage.includes("không thể")
    || normalizedMessage.includes("that bai")
    || normalizedMessage.includes("thất bại")
    || normalizedMessage.includes("loi")
    || normalizedMessage.includes("lỗi")
    || normalizedMessage.includes("khong tim thay")
    || normalizedMessage.includes("không tìm thấy")
  ) {
    return "error";
  }

  return "info";
}

function renderNotificationCenter(items) {
  if (!items.length) {
    return "";
  }

  return `
    <div class="toast-stack" aria-live="polite" aria-atomic="true">
      ${items.map((item) => `
        <article class="toast-card toast-${item.variant}">
          <div class="toast-body">
            <p class="toast-title">${escapeNotificationHtml(item.title)}</p>
            <p class="toast-message">${escapeNotificationHtml(item.message)}</p>
          </div>
          <button class="toast-close" type="button" data-action="toast-dismiss" data-id="${item.id}" aria-label="Dong thong bao">×</button>
        </article>
      `).join("")}
    </div>
  `;
}

function hasSearchFilters(pageState) {
  return Boolean(
    pageState.keyword
    || pageState.authorId
    || pageState.categoryId
    || pageState.publisherId
    || pageState.publishYear
    || pageState.available !== ""
  );
}

function isPublicPage(pageKey) {
  return PUBLIC_PAGE_KEYS.has(pageKey);
}

function isLoginPage(pageKey) {
  return pageKey === "login";
}

function isAdminPage(pageKey) {
  return !isPublicPage(pageKey) && !isLoginPage(pageKey);
}

const pageRegistry = {
  home: {
    meta: homeMeta,
    createState: createHomePageState,
    render: (store, state) => renderHomePage(store, state),
    bind: bindHomePage,
    load: async (store, state) => {
      await Promise.allSettled([
        store.loadDashboard(),
        store.loadBooks({
          page: state.page,
          size: state.size,
          sortBy: "createdAt",
          sortDir: "desc"
        }),
        store.loadAuthors(),
        store.loadCategories(),
        store.loadPublishers()
      ]);

      if (hasSearchFilters(state)) {
        await store.searchBooks({
          keyword: state.keyword,
          authorId: state.authorId,
          categoryId: state.categoryId,
          publisherId: state.publisherId,
          publishYear: state.publishYear,
          available: state.available === "" ? undefined : state.available === "true",
          page: state.page,
          size: state.size
        });
        return;
      }

      store.resetSearchResult();
    }
  },
  reader: {
    meta: readerMeta,
    render: (store) => renderReaderPage(store),
    load: async (store) => {
      await Promise.allSettled([
        store.loadDashboard(),
        store.loadCategories()
      ]);
    }
  },
  bookDetail: {
    meta: bookDetailMeta,
    createState: createBookDetailPageState,
    render: (store, state) => renderBookDetailPage(store, state),
    load: async (store, state) => {
      const routeBookId = resolveBookDetailIdFromLocation();
      const bookId = Number(routeBookId || state.bookId || 0);

      if (!bookId) {
        throw new Error("Không tìm thấy mã sách hợp lệ.");
      }

      state.bookId = bookId;
      await Promise.allSettled([
        store.loadDashboard(),
        store.loadAuthors(),
        store.loadCategories(),
        store.loadPublishers()
      ]);
      await store.loadPublicBookDetail(bookId);
    }
  },
  dashboard: {
    meta: dashboardMeta,
    render: (store) => renderDashboardPage(store),
    bind: bindDashboardPage,
    load: async (store) => {
      await store.loadDashboard();
    }
  },
  books: {
    meta: booksMeta,
    createState: createBooksPageState,
    render: (store, state) => renderBooksPage(store, state),
    bind: bindBooksPage,
    load: async (store, state) => {
      await Promise.all([
        store.loadAuthors(),
        store.loadCategories(),
        store.loadPublishers(),
        store.loadMedia(),
        store.loadBooks({
          keyword: state.keyword,
          authorId: state.authorId,
          categoryId: state.categoryId,
          publisherId: state.publisherId,
          available: state.available === "" ? undefined : state.available === "true",
          sortBy: state.sortBy,
          sortDir: state.sortDir,
          page: state.page,
          size: state.size
        })
      ]);
    }
  },
  authors: {
    meta: authorsMeta,
    createState: createAuthorsPageState,
    render: (store, state) => renderAuthorsPage(store, state),
    bind: bindAuthorsPage,
    load: async (store) => {
      await Promise.all([store.loadAuthors(), store.loadBookOptions()]);
    }
  },
  categories: {
    meta: categoriesMeta,
    createState: createCategoriesPageState,
    render: (store, state) => renderCategoriesPage(store, state),
    bind: bindCategoriesPage,
    load: async (store) => {
      await Promise.all([store.loadCategories(), store.loadBookOptions()]);
    }
  },
  publishers: {
    meta: publishersMeta,
    createState: createPublishersPageState,
    render: (store, state) => renderPublishersPage(store, state),
    bind: bindPublishersPage,
    load: async (store) => {
      await Promise.all([store.loadPublishers(), store.loadBookOptions()]);
    }
  },
  search: {
    meta: searchMeta,
    createState: createSearchPageState,
    render: (store, state) => renderSearchPage(store, state),
    bind: bindSearchPage,
    load: async (store, state) => {
      await Promise.all([store.loadAuthors(), store.loadCategories(), store.loadPublishers()]);

      if (hasSearchFilters(state)) {
        await store.searchBooks({
          keyword: state.keyword,
          authorId: state.authorId,
          categoryId: state.categoryId,
          publisherId: state.publisherId,
          publishYear: state.publishYear,
          available: state.available === "" ? undefined : state.available === "true",
          page: state.page,
          size: state.size
        });
        return;
      }

      store.resetSearchResult();
    }
  },
  media: {
    meta: mediaMeta,
    createState: createMediaPageState,
    render: (store, state) => renderMediaPage(store, state),
    bind: bindMediaPage,
    load: async (store) => {
      await Promise.all([store.loadBookOptions(), store.loadMedia()]);
    }
  },
  users: {
    meta: usersMeta,
    render: () => renderUsersPage()
  },
  circulation: {
    meta: circulationMeta,
    render: () => renderCirculationPage()
  },
  notifications: {
    meta: notificationsMeta,
    render: () => renderNotificationsPage()
  },
  operations: {
    meta: operationsMeta,
    render: () => renderOperationsPage()
  }
};

function normalizePathname(pathname) {
  const normalized = String(pathname || "").replace(/\/+$/, "");
  return normalized || "/";
}

function resolveBookDetailIdFromLocation() {
  const pathname = normalizePathname(window.location.pathname);
  const match = pathname.match(/^\/book\/(\d+)$/);
  return match ? Number(match[1]) : null;
}

function getPathForPage(pageKey, state = {}) {
  if (pageKey === "bookDetail") {
    const bookId = Number(state?.bookId || 0);
    return bookId ? `/book/${bookId}` : PAGE_PATHS[DEFAULT_PUBLIC_PAGE];
  }

  return PAGE_PATHS[pageKey] || PAGE_PATHS[DEFAULT_PUBLIC_PAGE];
}

function resolvePageKeyFromLocation() {
  const pathname = normalizePathname(window.location.pathname);
  if (/^\/book\/\d+$/.test(pathname)) {
    return "bookDetail";
  }
  if (pathname === PAGE_PATHS.bookDetail) {
    return DEFAULT_PUBLIC_PAGE;
  }
  return PATH_TO_PAGE[pathname] || DEFAULT_PUBLIC_PAGE;
}

function migrateLegacyHashRoute() {
  const legacyRoute = window.location.hash.replace(/^#/, "");

  if (!(pageRegistry[legacyRoute] || legacyRoute === "login")) {
    return;
  }

  const nextPath = getPathForPage(legacyRoute);
  window.history.replaceState({}, "", nextPath);
}

function renderPageState(title, message, variant = "loading") {
  return `
    <div class="page-state-card ${variant === "error" ? "is-error" : ""}">
      <p class="eyebrow">${variant === "error" ? "Load error" : "Loading"}</p>
      <h3>${title}</h3>
      <p class="subtle">${message}</p>
    </div>
  `;
}

function getPublicCategoryLinks(categories) {
  const categoryMap = new Map();

  categories.forEach((category) => {
    const normalizedName = String(category?.name || "").trim().toLowerCase();

    if (!normalizedName || categoryMap.has(normalizedName)) {
      return;
    }

    categoryMap.set(normalizedName, category);
  });

  return Array.from(categoryMap.values()).sort((first, second) =>
    String(first.name || "").localeCompare(String(second.name || ""), "vi")
  );
}

function getPublicAuthorLinks(authors) {
  return [...authors]
    .filter((author) => author?.name)
    .sort((first, second) => String(first.name).localeCompare(String(second.name), "vi"));
}

export function initLibraryApp() {
  const appRoot = document.getElementById("app");

  if (!appRoot) {
    return;
  }

  const store = createAppStore();
  const pageState = Object.fromEntries(
    Object.entries(pageRegistry)
      .filter(([, config]) => typeof config.createState === "function")
      .map(([pageKey, config]) => [pageKey, config.createState()])
  );
  const workspaceState = {
    bootstrapped: false,
    loading: false,
    error: "",
    activeLoadId: 0
  };
  const notificationState = {
    nextId: 1,
    items: []
  };

  migrateLegacyHashRoute();

  function bindNotificationButtons() {
    appRoot.querySelectorAll('[data-action="toast-dismiss"]').forEach((button) => {
      button.addEventListener("click", () => {
        dismissNotification(Number(button.dataset.id || 0));
      });
    });
  }

  function scheduleNotificationDismiss(id, duration = 4200) {
    window.setTimeout(() => {
      dismissNotification(id);
    }, duration);
  }

  function pushNotification(message, variant = resolveNotificationVariant(message), title) {
    const trimmedMessage = String(message || "").trim();

    if (!trimmedMessage) {
      return;
    }

    const id = notificationState.nextId++;
    const resolvedTitle = title || (
      variant === "success"
        ? "Thanh cong"
        : variant === "error"
          ? "Co loi xay ra"
          : "Thong bao"
    );

    notificationState.items = [
      ...notificationState.items.slice(-3),
      {
        id,
        variant,
        title: resolvedTitle,
        message: trimmedMessage
      }
    ];

    render();
    scheduleNotificationDismiss(id);
  }

  function dismissNotification(id) {
    if (!id) {
      return;
    }

    const nextItems = notificationState.items.filter((item) => item.id !== id);

    if (nextItems.length === notificationState.items.length) {
      return;
    }

    notificationState.items = nextItems;
    render();
  }

  function bindGlobalPageButtons() {
    appRoot.querySelectorAll("[data-page]").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.dataset.bookId) {
          navigateToPage("bookDetail", {
            bookId: Number(button.dataset.bookId || 0),
            message: ""
          });
          return;
        }

        if (button.dataset.categoryId) {
          navigateToPage("home", {
            keyword: "",
            authorId: "",
            categoryId: String(button.dataset.categoryId || ""),
            publisherId: "",
            publishYear: "",
            available: "",
            page: 0,
            size: 8,
            message: "",
            searchToolbarOpen: false,
            filterPanelOpen: false,
            scrollTarget: "home-book-discovery",
            detailOpen: false,
            selectedBook: null
          });
          return;
        }

        if (button.dataset.authorId) {
          navigateToPage("home", {
            keyword: "",
            authorId: String(button.dataset.authorId || ""),
            categoryId: "",
            publisherId: "",
            publishYear: "",
            available: "",
            page: 0,
            size: 8,
            message: "",
            filterPanelOpen: false,
            searchToolbarOpen: false,
            scrollTarget: "home-book-discovery",
            detailOpen: false,
            selectedBook: null
          });
          return;
        }

        navigateToPage(button.dataset.page);
      });
    });

    appRoot.querySelectorAll("[data-dropdown-filter-target]").forEach((input) => {
      input.addEventListener("input", () => {
        const filterTarget = input.dataset.dropdownFilterTarget;
        const list = appRoot.querySelector(`[data-dropdown-list="${filterTarget}"]`);
        const empty = appRoot.querySelector(`[data-dropdown-empty="${filterTarget}"]`);

        if (!list) {
          return;
        }

        const keyword = String(input.value || "").trim().toLowerCase();
        let visibleCount = 0;

        list.querySelectorAll("[data-dropdown-value]").forEach((item) => {
          const match = !keyword || String(item.dataset.dropdownValue || "").includes(keyword);
          item.hidden = !match;

          if (match) {
            visibleCount += 1;
          }
        });

        if (empty) {
          empty.hidden = visibleCount !== 0;
        }
      });
    });
  }

  function renderLogin() {
    appRoot.innerHTML = `${renderLoginShell()}${renderNotificationCenter(notificationState.items)}`;
    bindGlobalPageButtons();
    bindNotificationButtons();
    const authRoot = appRoot.querySelector("#auth-root");

    if (!authRoot) {
      return;
    }

    authRoot.innerHTML = renderLoginPage();
    bindLoginPage({
      root: authRoot,
      store,
      onLoginSuccess: async () => {
        navigateToPage(DEFAULT_ADMIN_PAGE, undefined, { replace: true });
      }
    });
  }

  function renderPublicWorkspace(session) {
    const activePage = resolvePageKeyFromLocation();
    const pageConfig = pageRegistry[activePage];
    let pageContent = "";

    if (workspaceState.loading) {
      pageContent = renderPageState(
        `Loading ${pageConfig.meta.title}`,
        "Please wait while the public pages fetch catalog data."
      );
    } else if (workspaceState.error) {
      pageContent = renderPageState(
        "Unable to load this page",
        workspaceState.error,
        "error"
      );
    } else {
      pageContent = pageConfig.render(store, pageState[activePage]);
    }

    appRoot.innerHTML = renderPublicShell({
      activePage,
      pageContent,
      isAuthenticated: Boolean(session),
      categoryLinks: getPublicCategoryLinks(store.getCategories()),
      authorLinks: getPublicAuthorLinks(store.getAuthors()),
      activeCategoryId: activePage === "home" ? pageState.home?.categoryId || "" : "",
      activeAuthorId: activePage === "home" ? pageState.home?.authorId || "" : "",
      toolbarContent: activePage === "home"
        ? renderHomeNavbarToolbar(store, pageState.home)
        : ""
    }) + renderNotificationCenter(notificationState.items);

    bindGlobalPageButtons();
    bindNotificationButtons();

    if (workspaceState.loading || workspaceState.error) {
      return;
    }

    const pageRoot = appRoot.querySelector(".page");

    if (pageRoot && typeof pageConfig.bind === "function") {
      pageConfig.bind({
        root: pageRoot,
        shellRoot: appRoot,
        store,
        pageState: pageState[activePage],
        setPageState: (patch, options = {}) => setPageState(activePage, patch, options),
        navigateToPage
      });
    }
  }

  function renderAdminWorkspace(session) {
    const activePage = resolvePageKeyFromLocation();
    const pageConfig = pageRegistry[activePage];
    let pageContent = "";

    if (workspaceState.loading) {
      pageContent = renderPageState(
        `Loading ${pageConfig.meta.title}`,
        "Please wait while the frontend fetches the latest backend data."
      );
    } else if (workspaceState.error) {
      pageContent = renderPageState(
        "Unable to load this page",
        workspaceState.error,
        "error"
      );
    } else {
      pageContent = pageConfig.render(store, pageState[activePage]);
    }

    appRoot.innerHTML = renderAppShell({
      session,
      activePage,
      pageTitle: pageConfig.meta.title,
      pageDescription: pageConfig.meta.description,
      pageContent,
      quickSearchQuery: pageState.search?.keyword || ""
    }) + renderNotificationCenter(notificationState.items);

    bindGlobalPageButtons();
    bindNotificationButtons();

    appRoot.querySelector('[data-action="logout"]')?.addEventListener("click", () => {
      store.logout();
      workspaceState.loading = false;
      workspaceState.error = "";
      navigateToPage("login", undefined, { replace: true });
    });

    const quickSearchForm = appRoot.querySelector("#quick-search-form");

    quickSearchForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(quickSearchForm);

      navigateToPage("search", {
        keyword: String(formData.get("query") || ""),
        authorId: "",
        categoryId: "",
        publisherId: "",
        publishYear: "",
        available: "",
        page: 0,
        message: ""
      });
    });

    if (workspaceState.loading || workspaceState.error) {
      return;
    }

    const pageRoot = appRoot.querySelector(".page");

    if (pageRoot && typeof pageConfig.bind === "function") {
      pageConfig.bind({
        root: pageRoot,
        store,
        pageState: pageState[activePage],
        setPageState: (patch, options = {}) => setPageState(activePage, patch, options),
        navigateToPage,
        openRecord,
        refreshPage: () => loadPage(activePage)
      });
    }
  }

  function render() {
    const activePage = resolvePageKeyFromLocation();
    const session = store.getSession();

    if (isLoginPage(activePage) && !session) {
      renderLogin();
      return;
    }

    if (!session && isAdminPage(activePage)) {
      navigateToPage("login", undefined, { replace: true });
      return;
    }

    if (session && isLoginPage(activePage)) {
      navigateToPage(DEFAULT_ADMIN_PAGE, undefined, { replace: true });
      return;
    }

    if (isPublicPage(activePage)) {
      renderPublicWorkspace(session);
      return;
    }

    renderAdminWorkspace(session);
  }

  function setPageState(pageKey, patch, options = {}) {
    if (!pageState[pageKey]) {
      return;
    }

    if (patch?.message && !options.silentToast) {
      pushNotification(patch.message);
    }

    pageState[pageKey] = {
      ...pageState[pageKey],
      ...patch
    };

    if (options.reload) {
      loadPage(pageKey);
      return;
    }

    render();
  }

  function navigateToPage(pageKey, statePatch, options = {}) {
    const nextPage = (pageRegistry[pageKey] || pageKey === "login") ? pageKey : DEFAULT_PUBLIC_PAGE;
    let nextState = pageState[nextPage] || {};

    if (statePatch && pageState[nextPage]) {
      nextState = {
        ...pageState[nextPage],
        ...statePatch
      };
      pageState[nextPage] = nextState;
    }

    const nextPath = getPathForPage(nextPage, nextState);

    if (normalizePathname(window.location.pathname) !== normalizePathname(nextPath)) {
      if (options.replace) {
        window.history.replaceState({}, "", nextPath);
      } else {
        window.history.pushState({}, "", nextPath);
      }
    }

    loadPage(nextPage);
  }

  function openRecord(pageKey, id) {
    const patches = {
      books: {
        selectedId: id,
        message: ""
      },
      authors: {
        selectedId: id,
        query: "",
        message: ""
      },
      categories: {
        selectedId: id,
        message: ""
      },
      publishers: {
        selectedId: id,
        query: "",
        message: ""
      },
      media: {
        selectedId: id,
        filterBookId: "",
        message: ""
      }
    };

    navigateToPage(pageKey, patches[pageKey] || {});
  }

  async function ensureBootstrap() {
    if (workspaceState.bootstrapped) {
      return;
    }

    await store.bootstrapCatalog();
    workspaceState.bootstrapped = true;
  }

  async function loadPage(pageKey = resolvePageKeyFromLocation()) {
    const session = store.getSession();

    if (!session && isAdminPage(pageKey)) {
      navigateToPage("login", undefined, { replace: true });
      return;
    }

    if (session && isLoginPage(pageKey)) {
      navigateToPage(DEFAULT_ADMIN_PAGE, undefined, { replace: true });
      return;
    }

    if (isLoginPage(pageKey)) {
      workspaceState.loading = false;
      workspaceState.error = "";
      render();
      return;
    }

    const currentLoadId = workspaceState.activeLoadId + 1;
    workspaceState.activeLoadId = currentLoadId;
    workspaceState.loading = true;
    workspaceState.error = "";
    render();

    try {
      if (isPublicPage(pageKey)) {
        const publicPageConfig = pageRegistry[pageKey];
        if (publicPageConfig?.load) {
          await publicPageConfig.load(store, pageState[pageKey] || {});
        }
        return;
      }

      await ensureBootstrap();

      const pageConfig = pageRegistry[pageKey];
      if (pageConfig?.load) {
        await pageConfig.load(store, pageState[pageKey] || {});
      }
    } catch (error) {
      if (workspaceState.activeLoadId !== currentLoadId) {
        return;
      }

      workspaceState.error = error?.message || "Unexpected page load failure.";
      pushNotification(workspaceState.error, "error", "Tai du lieu that bai");
    } finally {
      if (workspaceState.activeLoadId !== currentLoadId) {
        return;
      }

      workspaceState.loading = false;
      render();
    }
  }

  window.addEventListener("popstate", () => {
    loadPage(resolvePageKeyFromLocation());
  });

  if (!window.location.pathname || window.location.pathname === "/index.html") {
    window.history.replaceState({}, "", getPathForPage(DEFAULT_PUBLIC_PAGE));
  }

  loadPage(resolvePageKeyFromLocation());
}
