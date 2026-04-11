import { API_BASE_URL } from "../../config/api.js";
import { authorApi } from "../../modules/author/api/author.api.js";
import { categoryApi } from "../../modules/category/api/category.api.js";
import { bookApi } from "../../modules/book/api/book.api.js";
import { publisherApi } from "../../modules/publisher/api/publisher.api.js";
import { searchApi } from "../../modules/search/api/search.api.js";
import { catalogReportApi } from "../../modules/report/api/catalog-report.api.js";
import { mediaApi } from "../../modules/media/api/media.api.js";

const SESSION_STORAGE_KEY = "bookhub-console-session-v3";
const LOGIN_USERS = [
  {
    id: 1,
    name: "Admin User",
    email: "admin@bookhub.local",
    password: "123456",
    role: "Admin"
  },
  {
    id: 2,
    name: "Librarian User",
    email: "librarian@bookhub.local",
    password: "123456",
    role: "Librarian"
  }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readStorage(key, fallbackValue) {
  const savedValue = window.localStorage.getItem(key);

  if (!savedValue) {
    return clone(fallbackValue);
  }

  try {
    return JSON.parse(savedValue);
  } catch {
    return clone(fallbackValue);
  }
}

function createEmptyPage() {
  return {
    items: [],
    totalItems: 0,
    totalPages: 0,
    page: 0,
    size: 10,
    first: true,
    last: true
  };
}

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

export function createAppStore() {
  let session = readStorage(SESSION_STORAGE_KEY, null);
  const cache = {
    authors: [],
    categories: [],
    publishers: [],
    dashboard: normalizeDashboard(null),
    booksPage: createEmptyPage(),
    bookOptions: [],
    media: [],
    publicBookDetail: createEmptyPublicBookDetail(),
    searchResult: createEmptySearchResult()
  };

  function persistSession() {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }

  return {
    getSession() {
      return clone(session);
    },

    login(credentials) {
      const matchedUser = LOGIN_USERS.find(
        (user) => user.email === credentials.email.trim() && user.password === credentials.password
      );

      if (!matchedUser) {
        throw new Error("Email or password is incorrect.");
      }

      session = {
        id: matchedUser.id,
        name: matchedUser.name,
        email: matchedUser.email,
        role: matchedUser.role
      };
      persistSession();

      return clone(session);
    },

    logout() {
      session = null;
      persistSession();
    },

    async bootstrapCatalog() {
      await Promise.all([
        this.loadAuthors(),
        this.loadCategories(),
        this.loadPublishers(),
        this.loadDashboard(),
        this.loadBookOptions()
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

      await this.loadAuthors();
      await this.loadDashboard();

      return normalizeAuthor(savedAuthor);
    },

    async removeAuthor(authorId) {
      await authorApi.remove(authorId);
      await this.loadAuthors();
      await this.loadDashboard();
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

      await this.loadCategories();
      await this.loadDashboard();

      return normalizeCategory(savedCategory);
    },

    async removeCategory(categoryId) {
      await categoryApi.remove(categoryId);
      await this.loadCategories();
      await this.loadDashboard();
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

      await this.loadPublishers();
      await this.loadDashboard();

      return normalizePublisher(savedPublisher);
    },

    async removePublisher(publisherId) {
      await publisherApi.remove(publisherId);
      await this.loadPublishers();
      await this.loadDashboard();
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
      return cache.bookOptions.find((book) => book.id === Number(bookId))
        || cache.booksPage.items.find((book) => book.id === Number(bookId))
        || null;
    },

    async fetchBookById(bookId) {
      return normalizeBook(await bookApi.getById(bookId));
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

      await this.loadBookOptions();
      await this.loadDashboard();

      return normalizeBook(savedBook);
    },

    async removeBook(bookId) {
      await bookApi.remove(bookId);
      await this.loadBookOptions();
      await this.loadDashboard();
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
      await this.loadMedia();
      return normalizeMediaAsset(savedAsset);
    },

    async removeMedia(mediaId) {
      await mediaApi.remove(mediaId);
      await this.loadMedia();
    },

    async loadPublicBookDetail(bookId) {
      const book = await this.fetchBookById(bookId);
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
