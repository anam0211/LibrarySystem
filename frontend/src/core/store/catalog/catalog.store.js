import { API_BASE_URL } from "../../../config/api.js";
import { authorApi } from "../../../modules/author/api/author.api.js";
import { bookApi } from "../../../modules/book/api/book.api.js";
import { categoryApi } from "../../../modules/category/api/category.api.js";
import { mediaApi } from "../../../modules/media/api/media.api.js";
import { publisherApi } from "../../../modules/publisher/api/publisher.api.js";
import { catalogReportApi } from "../../../modules/report/api/catalog-report.api.js";
import { searchApi } from "../../../modules/search/api/search.api.js";
import { createEmptyPage } from "../store-utils.js";

function toAbsoluteBackendUrl(path) {
  if (!path) {
    return "";
  }

  try {
    const backendOrigin = new URL(API_BASE_URL).origin;
    return new URL(path, `${backendOrigin}/`).toString();
  } catch {
    return path;
  }
}

function normalizeAuthor(author) {
  return {
    ...author,
    bookCount: Number(author?.bookCount || 0)
  };
}

function normalizeCategory(category) {
  return {
    ...category,
    childCount: Number(category?.childCount || 0),
    bookCount: Number(category?.bookCount || 0)
  };
}

function normalizePublisher(publisher) {
  return {
    ...publisher,
    bookCount: Number(publisher?.bookCount || 0)
  };
}

function normalizeBook(book) {
  return {
    ...book,
    authors: Array.isArray(book?.authors) ? book.authors : [],
    categories: Array.isArray(book?.categories) ? book.categories : [],
    stockTotal: Number(book?.stockTotal || 0),
    stockAvailable: Number(book?.stockAvailable || 0),
    available: Boolean(book?.available),
    primaryImageUrl: toAbsoluteBackendUrl(book?.primaryImageUrl),
    primaryCategoryName: book?.categories?.[0]?.name || "Uncategorized",
    authorNames: (book?.authors || []).map((author) => author.name).join(", ")
  };
}

function normalizePage(page) {
  return {
    ...createEmptyPage(),
    ...(page || {}),
    items: Array.isArray(page?.items) ? page.items.map(normalizeBook) : []
  };
}

function normalizeDashboard(dashboard) {
  return {
    totalBooks: Number(dashboard?.totalBooks || 0),
    totalAuthors: Number(dashboard?.totalAuthors || 0),
    totalCategories: Number(dashboard?.totalCategories || 0),
    totalPublishers: Number(dashboard?.totalPublishers || 0),
    inStockBooks: Number(dashboard?.inStockBooks || 0),
    outOfStockBooks: Number(dashboard?.outOfStockBooks || 0),
    booksByCategory: Array.isArray(dashboard?.booksByCategory) ? dashboard.booksByCategory : [],
    topAuthors: Array.isArray(dashboard?.topAuthors) ? dashboard.topAuthors : [],
    topCategories: Array.isArray(dashboard?.topCategories) ? dashboard.topCategories : [],
    newestBooks: Array.isArray(dashboard?.newestBooks) ? dashboard.newestBooks.map(normalizeBook) : [],
    featuredBooks: Array.isArray(dashboard?.featuredBooks) ? dashboard.featuredBooks.map(normalizeBook) : []
  };
}

function normalizeMediaAsset(asset) {
  return {
    ...asset,
    primary: Boolean(asset?.primary),
    assetType: String(asset?.assetType || "unknown").toUpperCase(),
    fileUrl: toAbsoluteBackendUrl(asset?.fileUrl)
  };
}

function createEmptySearchResult() {
  return {
    page: createEmptyPage(),
    suggestions: []
  };
}

function createEmptyPublicBookDetail() {
  return {
    book: null,
    media: []
  };
}

export function attachCatalogStore(store, cache) {
  cache.authors = [];
  cache.categories = [];
  cache.publishers = [];
  cache.dashboard = normalizeDashboard(null);
  cache.booksPage = createEmptyPage();
  cache.bookOptions = [];
  cache.selectedBook = null;
  cache.media = [];
  cache.publicBookDetail = createEmptyPublicBookDetail();
  cache.searchResult = createEmptySearchResult();

  return {
    async bootstrapCatalog() {
      await Promise.all([
        store.loadAuthors(),
        store.loadCategories(),
        store.loadPublishers(),
        store.loadDashboard(),
        store.loadBookOptions()
      ]);
    },

    async loadDashboard() {
      cache.dashboard = normalizeDashboard(await catalogReportApi.getOverview());
      return cache.dashboard;
    },

    getDashboard() {
      return cache.dashboard;
    },

    async loadAuthors() {
      cache.authors = (await authorApi.getAll()).map(normalizeAuthor);
      return cache.authors;
    },

    getAuthors() {
      return cache.authors;
    },

    getAuthorById(authorId) {
      return cache.authors.find((author) => author.id === Number(authorId)) || null;
    },

    async saveAuthor(payload) {
      const requestPayload = {
        name: payload.name,
        bio: payload.bio
      };
      const savedAuthor = payload.id
        ? await authorApi.update(payload.id, requestPayload)
        : await authorApi.create(requestPayload);

      await store.loadAuthors();
      await store.loadDashboard();

      return normalizeAuthor(savedAuthor);
    },

    async removeAuthor(authorId) {
      await authorApi.remove(authorId);
      await store.loadAuthors();
      await store.loadDashboard();
    },

    async loadCategories() {
      cache.categories = (await categoryApi.getAll()).map(normalizeCategory);
      return cache.categories;
    },

    getCategories() {
      return cache.categories;
    },

    getCategoryById(categoryId) {
      return cache.categories.find((category) => category.id === Number(categoryId)) || null;
    },

    async saveCategory(payload) {
      const requestPayload = {
        name: payload.name,
        parentId: payload.parentId || null
      };
      const savedCategory = payload.id
        ? await categoryApi.update(payload.id, requestPayload)
        : await categoryApi.create(requestPayload);

      await store.loadCategories();
      await store.loadDashboard();

      return normalizeCategory(savedCategory);
    },

    async removeCategory(categoryId) {
      await categoryApi.remove(categoryId);
      await store.loadCategories();
      await store.loadDashboard();
    },

    async loadPublishers() {
      cache.publishers = (await publisherApi.getAll()).map(normalizePublisher);
      return cache.publishers;
    },

    getPublishers() {
      return cache.publishers;
    },

    getPublisherById(publisherId) {
      return cache.publishers.find((publisher) => publisher.id === Number(publisherId)) || null;
    },

    async savePublisher(payload) {
      const requestPayload = {
        name: payload.name
      };
      const savedPublisher = payload.id
        ? await publisherApi.update(payload.id, requestPayload)
        : await publisherApi.create(requestPayload);

      await store.loadPublishers();
      await store.loadDashboard();

      return normalizePublisher(savedPublisher);
    },

    async removePublisher(publisherId) {
      await publisherApi.remove(publisherId);
      await store.loadPublishers();
      await store.loadDashboard();
    },

    async loadBooks(filters = {}) {
      cache.booksPage = normalizePage(await bookApi.getAll(filters));
      return cache.booksPage;
    },

    async loadBookOptions() {
      const optionsPage = normalizePage(await bookApi.getAll({
        page: 0,
        size: 200,
        sortBy: "title",
        sortDir: "asc"
      }));
      cache.bookOptions = optionsPage.items;
      return cache.bookOptions;
    },

    getBookPage() {
      return cache.booksPage;
    },

    getBookOptions() {
      return cache.bookOptions;
    },

    getBookById(bookId) {
      if (cache.selectedBook?.id === Number(bookId)) {
        return cache.selectedBook;
      }

      return cache.bookOptions.find((book) => book.id === Number(bookId))
        || cache.booksPage.items.find((book) => book.id === Number(bookId))
        || null;
    },

    async fetchBookById(bookId) {
      cache.selectedBook = normalizeBook(await bookApi.getById(bookId));
      return cache.selectedBook;
    },

    async saveBook(payload) {
      const requestPayload = {
        isbn: payload.isbn,
        title: payload.title,
        subtitle: payload.subtitle,
        publisherId: payload.publisherId ? Number(payload.publisherId) : null,
        publishYear: payload.publishYear ? Number(payload.publishYear) : null,
        languageCode: payload.languageCode,
        pageCount: payload.pageCount ? Number(payload.pageCount) : null,
        description: payload.description,
        keywords: payload.keywords,
        stockTotal: Number(payload.stockTotal || 0),
        stockAvailable: Number(payload.stockAvailable || 0),
        status: payload.status,
        authorIds: (payload.authorIds || []).filter(Boolean).map(Number),
        categoryIds: (payload.categoryIds || []).filter(Boolean).map(Number)
      };

      const savedBook = payload.id
        ? await bookApi.update(payload.id, requestPayload)
        : await bookApi.create(requestPayload);

      await store.loadBookOptions();
      await store.loadDashboard();

      cache.selectedBook = normalizeBook(savedBook);
      return cache.selectedBook;
    },

    async removeBook(bookId) {
      await bookApi.remove(bookId);
      if (cache.selectedBook?.id === Number(bookId)) {
        cache.selectedBook = null;
      }
      await store.loadBookOptions();
      await store.loadDashboard();
    },

    async loadMedia() {
      cache.media = (await mediaApi.getAll()).map(normalizeMediaAsset);
      return cache.media;
    },

    getMedia() {
      return cache.media;
    },

    getMediaById(mediaId) {
      return cache.media.find((asset) => asset.id === Number(mediaId)) || null;
    },

    getMediaByBookId(bookId) {
      return cache.media.filter((asset) => asset.bookId === Number(bookId));
    },

    async uploadMedia(payload) {
      const savedAsset = await mediaApi.upload(payload);
      await store.loadMedia();
      return normalizeMediaAsset(savedAsset);
    },

    async removeMedia(mediaId) {
      await mediaApi.remove(mediaId);
      await store.loadMedia();
    },

    async loadPublicBookDetail(bookId) {
      const book = await store.fetchBookById(bookId);
      let media = [];

      try {
        media = await mediaApi.getByBook(bookId);
      } catch {
        media = [];
      }

      cache.publicBookDetail = {
        book,
        media: Array.isArray(media) ? media.map(normalizeMediaAsset) : []
      };

      return cache.publicBookDetail;
    },

    getPublicBookDetail() {
      return cache.publicBookDetail;
    },

    async searchBooks(params = {}) {
      cache.searchResult = {
        page: normalizePage(await searchApi.searchBooks(params)),
        suggestions: params.keyword
          ? (await searchApi.suggest(params.keyword, 8)).suggestions || []
          : []
      };

      return cache.searchResult;
    },

    getSearchResult() {
      return cache.searchResult;
    },

    resetSearchResult() {
      cache.searchResult = createEmptySearchResult();
      return cache.searchResult;
    }
  };
}
