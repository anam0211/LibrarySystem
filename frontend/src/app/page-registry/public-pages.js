import {
  homeMeta,
  createHomePageState,
  renderHomePage,
  bindHomePage
} from "../../modules/public/pages/home.page.js";
import {
  bookDetailMeta,
  createBookDetailPageState,
  renderBookDetailPage
} from "../../modules/public/pages/book-detail.page.js";
import { readerMeta, renderReaderPage } from "../../modules/public/pages/reader.page.js";
import { bookingMeta, renderBookingPage, bindBookingPage } from "../../modules/public/pages/booking.page.js";
import { historyMeta, renderHistoryPage, bindHistoryPage, loadHistoryPage } from "../../modules/public/pages/history.page.js";
import { notificationsMeta, renderNotificationsPage, bindNotificationsPage, loadNotificationsPage } from "../../modules/notification/pages/notifications.page.js";
function hasSearchFilters(pageState = {}) {
  return Boolean(
    pageState.keyword
    || pageState.authorId
    || pageState.categoryId
    || pageState.publisherId
    || pageState.publishYear
    || pageState.available !== ""
  );
}

function normalizePathname(pathname) {
  const normalized = String(pathname || "").replace(/\/+$/, "");
  return normalized || "/";
}

function resolveBookDetailIdFromLocation() {
  const pathname = normalizePathname(window.location.pathname);
  const match = pathname.match(/^\/book\/(\d+)$/);
  return match ? Number(match[1]) : null;
}

export const publicPagePaths = {
  home: "/",
  bookDetail: "/book",
  reader: "/reader",
  booking: "/booking",
  history: "/history",
  notifications: "/notifications",
};

export const publicPageRegistry = {
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
        store.loadCategories(),
        (typeof store.loadMyHistory === 'function' ? store.loadMyHistory() : Promise.resolve())
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
        throw new Error("Khong tim thay ma sach hop le.");
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
  booking: {
    meta: bookingMeta,
    createState: () => ({ bookId: 0 }),
    render: (store, state) => renderBookingPage(store, state),
    bind: (context) => bindBookingPage(context)
  },
  history: {
    meta: historyMeta,
    render: renderHistoryPage,
    bind: bindHistoryPage,
    load: loadHistoryPage   
  },
  notifications: {
    meta: notificationsMeta,
    render: renderNotificationsPage,
    bind: bindNotificationsPage,
    load: loadNotificationsPage
  }
};

export const PUBLIC_PAGE_KEYS = new Set(Object.keys(publicPageRegistry));
