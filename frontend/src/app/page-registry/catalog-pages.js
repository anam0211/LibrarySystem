import { dashboardMeta, renderDashboardPage, bindDashboardPage } from "../../modules/dashboard/pages/dashboard.page.js";
import {
  booksMeta,
  createBooksPageState,
  renderBooksPage,
  bindBooksPage
} from "../../modules/book/pages/book.page.js";
import {
  authorsMeta,
  createAuthorsPageState,
  renderAuthorsPage,
  bindAuthorsPage
} from "../../modules/author/pages/author.page.js";
import {
  categoriesMeta,
  createCategoriesPageState,
  renderCategoriesPage,
  bindCategoriesPage
} from "../../modules/category/pages/category.page.js";
import {
  publishersMeta,
  createPublishersPageState,
  renderPublishersPage,
  bindPublishersPage
} from "../../modules/publisher/pages/publisher.page.js";
import {
  searchMeta,
  createSearchPageState,
  renderSearchPage,
  bindSearchPage
} from "../../modules/search/pages/search.page.js";
import {
  mediaMeta,
  createMediaPageState,
  renderMediaPage,
  bindMediaPage
} from "../../modules/media/pages/media.page.js";

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

export const catalogPagePaths = {
  dashboard: "/dashboard",
  books: "/books",
  authors: "/authors",
  categories: "/categories",
  publishers: "/publishers",
  search: "/search",
  media: "/media"
};

export const catalogPageRegistry = {
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

      if (state.selectedId && !store.getBookById(state.selectedId)) {
        await store.fetchBookById(state.selectedId);
      }
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
  }
};
