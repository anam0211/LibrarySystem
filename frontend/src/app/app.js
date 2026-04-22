import { createAppStore } from "../core/store/app-store.js";
import { renderLoginShell, renderAppShell, renderPublicShell } from "../shared/layout/app-shell.js";
import { scrollToTop } from "../shared/utils/scroll.js";
import { renderLoginPage, bindLoginPage } from "../modules/user/pages/login.page.js";
import { renderHomeNavbarToolbar } from "../modules/public/pages/home.page.js";
import { publicPagePaths, publicPageRegistry, PUBLIC_PAGE_KEYS } from "./page-registry/public-pages.js";
import { catalogPagePaths, catalogPageRegistry } from "./page-registry/catalog-pages.js";
import { operationsPagePaths, operationsPageRegistry } from "./page-registry/operations-pages.js";

const DEFAULT_PUBLIC_PAGE = "home";
const DEFAULT_ADMIN_PAGE = "dashboard";
const HOME_PAGE_STORAGE_KEY = "bookhub.home.pageState";
const PAGE_PATHS = {
  ...publicPagePaths,
  login: "/login",
  ...catalogPagePaths,
  ...operationsPagePaths
};
const pageRegistry = {
  ...publicPageRegistry,
  ...catalogPageRegistry,
  ...operationsPageRegistry
};
const PATH_TO_PAGE = Object.fromEntries(
  Object.entries(PAGE_PATHS).map(([pageKey, path]) => [path, pageKey])
);

PATH_TO_PAGE["/home"] = "home";

function readStoredPageState(pageKey) {
  if (pageKey !== "home") {
    return {};
  }

  try {
    const rawValue = window.sessionStorage.getItem(HOME_PAGE_STORAGE_KEY);

    if (!rawValue) {
      return {};
    }

    const parsedValue = JSON.parse(rawValue);
    return parsedValue && typeof parsedValue === "object" ? parsedValue : {};
  } catch {
    return {};
  }
}

function writeStoredPageState(pageKey, state) {
  if (pageKey !== "home") {
    return;
  }

  const payload = {
    keyword: String(state.keyword || ""),
    authorId: String(state.authorId || ""),
    categoryId: String(state.categoryId || ""),
    publisherId: String(state.publisherId || ""),
    publishYear: String(state.publishYear || ""),
    available: String(state.available || ""),
    page: Number(state.page || 0),
    size: Number(state.size || 8)
  };

  try {
    window.sessionStorage.setItem(HOME_PAGE_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage failures in private mode or locked-down browsers.
  }
}

function parseOptionalNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function parsePositiveNumber(value, fallback) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

function parseNonNegativeNumber(value, fallback) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : fallback;
}

function appendSearchParam(params, key, value, fallback = "") {
  if (value === undefined || value === null || value === "" || value === fallback) {
    return;
  }

  params.set(key, String(value));
}

function readPageStateFromLocation(pageKey) {
  const params = new URLSearchParams(window.location.search);

  switch (pageKey) {
    case "home":
      return {
        keyword: params.get("keyword") || "",
        authorId: params.get("authorId") || "",
        categoryId: params.get("categoryId") || "",
        publisherId: params.get("publisherId") || "",
        publishYear: params.get("publishYear") || "",
        available: params.get("available") || "",
        page: parseNonNegativeNumber(params.get("page"), 0),
        size: parsePositiveNumber(params.get("size"), 8)
      };
    case "books":
      return {
        keyword: params.get("keyword") || "",
        authorId: params.get("authorId") || "",
        categoryId: params.get("categoryId") || "",
        publisherId: params.get("publisherId") || "",
        available: params.get("available") || "",
        sortBy: params.get("sortBy") || "createdAt",
        sortDir: params.get("sortDir") || "desc",
        page: parseNonNegativeNumber(params.get("page"), 0),
        size: parsePositiveNumber(params.get("size"), 10),
        selectedId: parseOptionalNumber(params.get("selected"))
      };
    case "authors":
      return {
        query: params.get("q") || "",
        selectedId: parseOptionalNumber(params.get("selected"))
      };
    case "categories":
      return {
        selectedId: parseOptionalNumber(params.get("selected"))
      };
    case "publishers":
      return {
        query: params.get("q") || "",
        selectedId: parseOptionalNumber(params.get("selected"))
      };
    case "search":
      return {
        keyword: params.get("keyword") || "",
        authorId: params.get("authorId") || "",
        categoryId: params.get("categoryId") || "",
        publisherId: params.get("publisherId") || "",
        publishYear: params.get("publishYear") || "",
        available: params.get("available") || "",
        page: parseNonNegativeNumber(params.get("page"), 0),
        size: parsePositiveNumber(params.get("size"), 10)
      };
    case "users":
      return {
        query: params.get("q") || "",
        status: params.get("status") || "",
        selectedId: parseOptionalNumber(params.get("selected"))
      };
    case "booking":
      return {
        bookId: parseOptionalNumber(params.get("bookId"))
      };
    default:
      return {};
  }
}

function buildSearchParamsForPage(pageKey, state = {}) {
  const params = new URLSearchParams();

  switch (pageKey) {
    case "home":
      appendSearchParam(params, "keyword", state.keyword);
      appendSearchParam(params, "authorId", state.authorId);
      appendSearchParam(params, "categoryId", state.categoryId);
      appendSearchParam(params, "publisherId", state.publisherId);
      appendSearchParam(params, "publishYear", state.publishYear);
      appendSearchParam(params, "available", state.available);
      appendSearchParam(params, "page", state.page, 0);
      appendSearchParam(params, "size", state.size, 8);
      break;
    case "books":
      appendSearchParam(params, "keyword", state.keyword);
      appendSearchParam(params, "authorId", state.authorId);
      appendSearchParam(params, "categoryId", state.categoryId);
      appendSearchParam(params, "publisherId", state.publisherId);
      appendSearchParam(params, "available", state.available);
      appendSearchParam(params, "sortBy", state.sortBy, "createdAt");
      appendSearchParam(params, "sortDir", state.sortDir, "desc");
      appendSearchParam(params, "page", state.page, 0);
      appendSearchParam(params, "size", state.size, 10);
      appendSearchParam(params, "selected", state.selectedId);
      break;
    case "authors":
      appendSearchParam(params, "q", state.query);
      appendSearchParam(params, "selected", state.selectedId);
      break;
    case "categories":
      appendSearchParam(params, "selected", state.selectedId);
      break;
    case "publishers":
      appendSearchParam(params, "q", state.query);
      appendSearchParam(params, "selected", state.selectedId);
      break;
    case "search":
      appendSearchParam(params, "keyword", state.keyword);
      appendSearchParam(params, "authorId", state.authorId);
      appendSearchParam(params, "categoryId", state.categoryId);
      appendSearchParam(params, "publisherId", state.publisherId);
      appendSearchParam(params, "publishYear", state.publishYear);
      appendSearchParam(params, "available", state.available);
      appendSearchParam(params, "page", state.page, 0);
      appendSearchParam(params, "size", state.size, 10);
      break;
    case "users":
      appendSearchParam(params, "q", state.query);
      appendSearchParam(params, "status", state.status);
      appendSearchParam(params, "selected", state.selectedId);
      break;
    case "booking":
      appendSearchParam(params, "bookId", state.bookId);
      break;
    default:
      break;
  }

  return params;
}

function getDefaultPageForRole(role) {
  if (role === "READER") {
    return "reader";
  }

  if (role === "ADMIN") {
    return "operations";
  }

  return DEFAULT_ADMIN_PAGE;
}

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
    || normalizedMessage.includes("da tai")
    || normalizedMessage.includes("da luu")
  ) {
    return "success";
  }

  if (
    normalizedMessage.includes("khong the")
    || normalizedMessage.includes("that bai")
    || normalizedMessage.includes("loi")
    || normalizedMessage.includes("khong tim thay")
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
          <button class="toast-close" type="button" data-action="toast-dismiss" data-id="${item.id}" aria-label="Dong thong bao">x</button>
        </article>
      `).join("")}
    </div>
  `;
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

function normalizePathname(pathname) {
  const normalized = String(pathname || "").replace(/\/+$/, "");
  return normalized || "/";
}

function getUrlForPage(pageKey, state = {}) {
  if (pageKey === "bookDetail") {
    const bookId = Number(state?.bookId || 0);
    return bookId ? `/book/${bookId}` : PAGE_PATHS[DEFAULT_PUBLIC_PAGE];
  }

  const pathname = PAGE_PATHS[pageKey] || PAGE_PATHS[DEFAULT_PUBLIC_PAGE];
  const params = buildSearchParamsForPage(pageKey, state);
  const search = params.toString();

  return search ? `${pathname}?${search}` : pathname;
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

  const nextPath = getUrlForPage(legacyRoute);
  window.history.replaceState({}, "", nextPath);
}

function renderPageState(title, message, variant = "loading") {
  const eyebrow = variant === "error" ? "Co loi" : "Dang tai";

  return `
    <div class="page-state-card ${variant === "error" ? "is-error" : ""}">
      <p class="eyebrow">${eyebrow}</p>
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
      .map(([pageKey, config]) => [
        pageKey,
        {
          ...config.createState(),
          ...readStoredPageState(pageKey)
        }
      ])
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
  let pendingPageScroll = "";

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

  function createCleanHomeState(overrides = {}) {
    const defaultState = typeof pageRegistry.home?.createState === "function"
      ? pageRegistry.home.createState()
      : {};

    return {
      ...defaultState,
      message: "",
      searchToolbarOpen: false,
      filterPanelOpen: false,
      scrollTarget: "",
      detailOpen: false,
      selectedBook: null,
      ...overrides
    };
  }

  function bindGlobalPageButtons() {
    appRoot.querySelectorAll("[data-page]").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.dataset.bookId) {
          const targetPage = (button.dataset.page && button.dataset.page !== "home") 
                              ? button.dataset.page 
                              : "bookDetail";                  
          navigateToPage(targetPage, {
            bookId: Number(button.dataset.bookId || 0),
            message: ""
          }, { scrollTop: true });
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

        if (button.dataset.page === "home") {
          navigateToPage("home", createCleanHomeState(), { scrollTop: true });
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
        const session = store.getSession();
        navigateToPage(getDefaultPageForRole(session?.role), undefined, { replace: true });
      }
    });
  }

  function renderPublicWorkspace(session) {
    const activePage = resolvePageKeyFromLocation();
    const pageConfig = pageRegistry[activePage];
    let pageContent = "";

    if (workspaceState.loading) {
      pageContent = renderPageState(
        `Dang tai ${pageConfig.meta.title}`,
        "Vui long cho trong luc he thong lay du lieu catalog."
      );
    } else if (workspaceState.error) {
      pageContent = renderPageState(
        "Khong the tai trang nay",
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
      session,
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

    appRoot.querySelector('[data-action="public-logout"]')?.addEventListener("click", () => {
      store.logout();
      workspaceState.loading = false;
      workspaceState.error = "";
      navigateToPage("home", undefined, { replace: true });
    });

    const userMenuBtn = appRoot.querySelector(".public-user-btn");
    const userPanel = appRoot.querySelector(".public-user-panel");
    if (userMenuBtn && userPanel) {
      userMenuBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        const isOpen = userPanel.classList.toggle("is-open");
        userMenuBtn.setAttribute("aria-expanded", String(isOpen));
      });
      document.addEventListener("click", () => {
        userPanel.classList.remove("is-open");
        userMenuBtn.setAttribute("aria-expanded", "false");
      });
    }

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

    if (pendingPageScroll) {
      const behavior = pendingPageScroll;
      pendingPageScroll = "";
      window.requestAnimationFrame(() => {
        scrollToTop(behavior);
      });
    }
  }

  function renderAdminWorkspace(session) {
    const activePage = resolvePageKeyFromLocation();
    const pageConfig = pageRegistry[activePage];
    let pageContent = "";

    if (workspaceState.loading) {
      pageContent = renderPageState(
        `Dang tai ${pageConfig.meta.title}`,
        "Vui long cho trong luc he thong dong bo du lieu moi nhat tu backend."
      );
    } else if (workspaceState.error) {
      pageContent = renderPageState(
        "Khong the tai trang nay",
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

    if (pendingPageScroll) {
      const behavior = pendingPageScroll;
      pendingPageScroll = "";
      window.requestAnimationFrame(() => {
        scrollToTop(behavior);
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

    if (session?.role === "READER" && isAdminPage(activePage)) {
      navigateToPage("reader", undefined, { replace: true });
      return;
    }

    if (session?.role === "LIBRARIAN" && activePage === "users") {
      navigateToPage("dashboard", undefined, { replace: true });
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
    writeStoredPageState(pageKey, pageState[pageKey]);

    if (options.reload) {
      const activePage = resolvePageKeyFromLocation();

      if (pageKey === activePage) {
        const nextUrl = getUrlForPage(pageKey, pageState[pageKey]);
        const currentUrl = `${normalizePathname(window.location.pathname)}${window.location.search}`;

        if (currentUrl !== nextUrl) {
          if (options.replace) {
            window.history.replaceState({}, "", nextUrl);
          } else {
            window.history.pushState({}, "", nextUrl);
          }
        }
      }

      loadPage(pageKey, { syncFromLocation: false });
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
      writeStoredPageState(nextPage, nextState);
    }

    const nextPath = getUrlForPage(nextPage, nextState);
    const currentUrl = `${normalizePathname(window.location.pathname)}${window.location.search}`;

    if (currentUrl !== nextPath) {
      if (options.scrollTop) {
        pendingPageScroll = "auto";
      }

      if (options.replace) {
        window.history.replaceState({}, "", nextPath);
      } else {
        window.history.pushState({}, "", nextPath);
      }
    }

    loadPage(nextPage, { syncFromLocation: false });
  }

  function openRecord(pageKey, id) {
    const patches = {
      books: {
        selectedId: id,
        message: "",
        scrollTarget: "books-detail-section"
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

  async function loadPage(pageKey = resolvePageKeyFromLocation(), options = {}) {
    if (options.syncFromLocation && pageState[pageKey]) {
      const defaultState = typeof pageRegistry[pageKey]?.createState === "function"
        ? pageRegistry[pageKey].createState()
        : {};

      pageState[pageKey] = {
        ...defaultState,
        ...readStoredPageState(pageKey),
        ...readPageStateFromLocation(pageKey)
      };
      writeStoredPageState(pageKey, pageState[pageKey]);
    }

    const session = store.getSession();

    if (!session && isAdminPage(pageKey)) {
      navigateToPage("login", undefined, { replace: true });
      return;
    }

    if (session?.role === "READER" && isAdminPage(pageKey)) {
      navigateToPage("reader", undefined, { replace: true });
      return;
    }

    if (session?.role === "LIBRARIAN" && pageKey === "users") {
      navigateToPage("dashboard", undefined, { replace: true });
      return;
    }

    if (isLoginPage(pageKey)) {
      if (session) {
        const validSession = await store.validateSession();

        if (validSession) {
          navigateToPage(getDefaultPageForRole(store.getSession()?.role), undefined, { replace: true });
          return;
        }
      }

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

      const validSession = await store.validateSession();

      if (!validSession) {
        navigateToPage("login", undefined, { replace: true });
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

      workspaceState.error = error?.message || "Khong the tai trang hien tai.";
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
    loadPage(resolvePageKeyFromLocation(), { syncFromLocation: true });
  });

  if (!window.location.pathname || window.location.pathname === "/index.html") {
    window.history.replaceState({}, "", getUrlForPage(DEFAULT_PUBLIC_PAGE));
  }

  loadPage(resolvePageKeyFromLocation(), { syncFromLocation: true });
}
