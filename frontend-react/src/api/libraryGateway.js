import { toAbsoluteMediaUrl } from "./apiClient";
import { libraryApi } from "./libraryApi";
import { mockLibrary } from "../mocks/mockLibrary";

const COVER_TONES = ["#315068", "#5a6f46", "#6f4f7a", "#9a6b35", "#317a59", "#3c6f91", "#8b4f5f"];
const ENABLE_MOCKS = import.meta.env.VITE_ENABLE_MOCKS === "true";

async function useBackend(backendCall, fallbackCall) {
  try {
    return await backendCall();
  } catch (error) {
    if (!ENABLE_MOCKS || typeof fallbackCall !== "function") {
      throw error;
    }

    return fallbackCall();
  }
}

function normalizeOption(item) {
  if (typeof item === "string") {
    return { id: item, name: item };
  }

  return {
    id: item?.id ?? item?.name ?? item?.label,
    name: item?.name ?? item?.label ?? String(item?.id ?? "")
  };
}

function normalizeBook(rawBook = {}, index = 0) {
  const authors = Array.isArray(rawBook.authors)
    ? rawBook.authors.map((author) => (typeof author === "string" ? author : author.name)).filter(Boolean)
    : rawBook.authorNames
      ? String(rawBook.authorNames).split(",").map((value) => value.trim()).filter(Boolean)
      : [];

  const categories = Array.isArray(rawBook.categories)
    ? rawBook.categories.map((category) => (typeof category === "string" ? category : category.name)).filter(Boolean)
    : [];

  const category = rawBook.category || rawBook.primaryCategoryName || categories[0] || "Chưa phân loại";
  const stockTotal = Number(rawBook.stockTotal ?? rawBook.totalStock ?? 0);
  const stockAvailable = Number(rawBook.stockAvailable ?? rawBook.availableStock ?? 0);

  return {
    id: Number(rawBook.id),
    isbn: rawBook.isbn || "",
    title: rawBook.title || "Sách chưa đặt tên",
    subtitle: rawBook.subtitle || "",
    authors: authors.length ? authors : ["Chưa có tác giả"],
    category,
    publisher: rawBook.publisherName || rawBook.publisher?.name || rawBook.publisher || "Chưa có NXB",
    publishYear: rawBook.publishYear || rawBook.year || "",
    language: rawBook.language || rawBook.languageCode || "vi",
    pages: rawBook.pages || rawBook.pageCount || 0,
    stockTotal,
    stockAvailable,
    rating: Number(rawBook.rating || rawBook.averageRating || 4.5),
    borrowCount: Number(rawBook.borrowCount || rawBook.loanCount || 0),
    favoriteCount: Number(rawBook.favoriteCount || 0),
    featured: Boolean(rawBook.featured),
    coverTone: rawBook.coverTone || COVER_TONES[index % COVER_TONES.length],
    description: rawBook.description || "Chưa có mô tả chi tiết cho đầu sách này.",
    reviews: Array.isArray(rawBook.reviews) ? rawBook.reviews : [],
    primaryImageUrl: rawBook.primaryImageUrl || rawBook.coverUrl || rawBook.imageUrl || ""
  };
}

function normalizeMedia(asset = {}) {
  const fileUrl = asset.fileUrl || asset.url || asset.path || "";
  const fileName = asset.fileName || asset.name || fileUrl.split("/").pop() || "Tệp đính kèm";
  const extension = fileName.includes(".") ? fileName.split(".").pop() : "";

  return {
    id: asset.id || fileUrl || fileName,
    bookId: asset.bookId,
    bookTitle: asset.bookTitle,
    fileName,
    fileUrl,
    assetType: String(asset.assetType || asset.type || extension || "FILE").toUpperCase(),
    primary: Boolean(asset.primary),
    createdAt: asset.createdAt || asset.createdDate || ""
  };
}

function normalizePage(pageData, filters = {}) {
  const rawItems = Array.isArray(pageData)
    ? pageData
    : Array.isArray(pageData?.items)
      ? pageData.items
      : Array.isArray(pageData?.content)
        ? pageData.content
        : [];
  const page = Number(pageData?.page ?? pageData?.number ?? filters.page ?? 0);
  const size = Number(pageData?.size ?? filters.size ?? rawItems.length ?? 8);

  return {
    items: rawItems.map(normalizeBook),
    totalItems: Number(pageData?.totalItems ?? pageData?.totalElements ?? rawItems.length),
    totalPages: Number(pageData?.totalPages ?? Math.ceil(rawItems.length / Math.max(size, 1))),
    page,
    size
  };
}

function normalizeKycStatus(status) {
  if (status === "UNVERIFIED") {
    return "NEW";
  }

  return status || "NEW";
}

function extractFileName(value) {
  if (!value) {
    return "";
  }

  const sanitizedValue = String(value).split("?")[0].split("#")[0];
  const segments = sanitizedValue.split("/").filter(Boolean);
  return segments[segments.length - 1] || sanitizedValue;
}

function resolveKycDocument(rawUser = {}) {
  const rawUrl = rawUser.idCardImageUrl || rawUser.kycDocument?.fileUrl || rawUser.kycDocument?.url || "";
  const rawFileName = rawUser.kycDocument?.fileName || extractFileName(rawUrl) || rawUser.idCardNumber || "";

  if (!rawFileName && !rawUrl) {
    return null;
  }

  return {
    type: rawUser.kycDocument?.type || "CCCD",
    fileName: rawFileName,
    fileUrl: rawUrl ? toAbsoluteMediaUrl(rawUrl) : "",
    uploadedAt: rawUser.kycDocument?.uploadedAt || rawUser.updatedAt || rawUser.createdAt || ""
  };
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Khong the doc tep e-KYC."));
    reader.readAsDataURL(file);
  });
}

function buildKycPayload(values = {}, file) {
  const payload = {
    email: values.email || "",
    phone: values.phone || "",
    address: values.address || "",
    idCardNumber: values.idCardNumber || ""
  };

  if (typeof file === "string") {
    payload.idCardImageUrl = file;
  } else if (file instanceof Blob) {
    payload.idCardImageBase64 = file;
  } else if (file != null) {
    throw new Error("Tep e-KYC khong hop le.");
  }

  return payload;
}

function normalizeUser(rawUser = {}) {
  const kycStatus = normalizeKycStatus(rawUser.kycStatus || rawUser.verificationStatus);
  const userId = Number(rawUser.id ?? rawUser.userId ?? 0);
  const accountEmail = rawUser.accountEmail || rawUser.email || "";
  const verificationEmail = rawUser.verificationEmail || rawUser.email || "";
  const verificationPhone = rawUser.verificationPhone || rawUser.phone || "";
  const verificationAddress = rawUser.verificationAddress || rawUser.address || "";

  return {
    ...rawUser,
    id: userId,
    fullName: rawUser.fullName || rawUser.name || rawUser.email || "Người dùng",
    email: verificationEmail,
    accountEmail,
    verificationEmail,
    role: rawUser.role || "READER",
    phone: verificationPhone,
    verificationPhone,
    address: verificationAddress,
    verificationAddress,
    idCardNumber: rawUser.idCardNumber || "",
    studentCode: rawUser.studentCode || rawUser.code || `USER-${userId || ""}`,
    status: rawUser.status || "ACTIVE",
    kycStatus,
    cardCode: rawUser.cardCode || rawUser.libraryCardCode || (kycStatus === "VERIFIED" ? `LIB-USER-${userId || ""}` : ""),
    kycDocument: resolveKycDocument(rawUser),
    canEdit: rawUser.canEdit !== false,
    canResubmit: rawUser.canResubmit !== false,
    adminApprovalEnabled: Boolean(rawUser.adminApprovalEnabled),
    wishlist: Array.isArray(rawUser.wishlist) ? rawUser.wishlist : []
  };
}

function mapLoanStatus(rawLoan = {}) {
  const status = rawLoan.status || "";

  if (["NEW", "PACKING", "SHIPPING", "BORROWING", "RETURNING", "RETURNED", "OVERDUE"].includes(status)) {
    return status;
  }

  const map = {
    PENDING: "NEW",
    PREPARING: "PACKING",
    OPEN: "BORROWING",
    RETURNING: "RETURNING",
    CLOSED: "RETURNED",
    EXPIRED: "OVERDUE",
    CANCELLED: "RETURNED"
  };

  return map[status] || "BORROWING";
}

function toBackendDeliveryMethod(receiveMethod) {
  return receiveMethod === "DELIVERY" || receiveMethod === "HOME_DELIVERY" ? "HOME_DELIVERY" : "PICKUP";
}

function toFrontendReceiveMethod(value, deliveryAddress) {
  if (value === "HOME_DELIVERY" || value === "DELIVERY" || deliveryAddress) {
    return "DELIVERY";
  }

  return "PICKUP";
}

function makeFallbackTracking(status, receiveMethod) {
  const labels = receiveMethod === "DELIVERY"
    ? {
        NEW: "Đã đặt",
        PACKING: "Đang gói",
        SHIPPING: "Đang giao",
        BORROWING: "Đang mượn",
        RETURNED: "Đã trả"
      }
    : {
        NEW: "Đã đặt",
        PACKING: "Sẵn sàng nhận",
        SHIPPING: "Đã nhận tại quầy",
        BORROWING: "Đang mượn",
        RETURNED: "Đã trả"
      };
  const order = ["NEW", "PACKING", "SHIPPING", "BORROWING", "RETURNED"];
  const currentIndex = Math.max(0, order.indexOf(status));

  return order.map((key, index) => ({
    key,
    label: labels[key],
    time: index <= currentIndex ? "BE" : "",
    done: index <= currentIndex
  }));
}

function makeLoanTracking(status, receiveMethod) {
  const labels = receiveMethod === "DELIVERY"
    ? {
        NEW: "Đã đặt",
        PACKING: "Đang đóng gói",
        SHIPPING: "Đang giao",
        BORROWING: "Đang mượn",
        RETURNING: "Chờ nhận trả",
        RETURNED: "Đã trả"
      }
    : {
        NEW: "Chờ xác nhận",
        BORROWING: "Đang mượn",
        RETURNED: "Đã trả"
      };
  const order = receiveMethod === "DELIVERY"
    ? ["NEW", "PACKING", "SHIPPING", "BORROWING", "RETURNING", "RETURNED"]
    : ["NEW", "BORROWING", "RETURNED"];
  const currentIndex = Math.max(0, order.indexOf(status));

  return order.map((key, index) => ({
    key,
    label: labels[key],
    time: index <= currentIndex ? "BE" : "",
    done: index <= currentIndex
  }));
}

function normalizeLoan(rawLoan = {}, books = []) {
  const id = rawLoan.id || rawLoan.loanId || rawLoan.code;
  const loanBooks = Array.isArray(rawLoan.books)
    ? rawLoan.books.map(normalizeBook)
    : Array.isArray(rawLoan.items)
      ? rawLoan.items.map((item) => normalizeBook({
          id: item.bookId || item.id,
          title: item.bookTitle || item.title,
          stockAvailable: 1
        }))
      : rawLoan.book
        ? [normalizeBook({ title: rawLoan.book, id: rawLoan.bookId || id })]
        : books;

  const status = mapLoanStatus(rawLoan);
  const receiveMethod = toFrontendReceiveMethod(rawLoan.receiveMethod || rawLoan.deliveryMethod, rawLoan.deliveryAddress);

  return {
    ...rawLoan,
    id: String(id),
    userId: Number(rawLoan.userId || rawLoan.borrowerId || rawLoan.readerId || 0),
    readerName: rawLoan.readerName || rawLoan.reader || rawLoan.borrowerName || "-",
    books: loanBooks,
    bookTitle: rawLoan.bookTitle || loanBooks.map((book) => book.title).join(", ") || rawLoan.book || "-",
    receiveMethod,
    address: rawLoan.address || rawLoan.deliveryAddress || "Quầy lưu thông",
    phone: rawLoan.phone || rawLoan.deliveryPhone || "",
    status,
    createdAt: rawLoan.createdAt || rawLoan.borrowDate || rawLoan.createdDate || "",
    dueDate: rawLoan.dueDate || rawLoan.returnDueDate || rawLoan.dueAt || "",
    deliveryFee: Number(rawLoan.deliveryFee || 0),
    tracking: Array.isArray(rawLoan.tracking) && rawLoan.tracking.length
      ? rawLoan.tracking
      : makeLoanTracking(status, receiveMethod)
  };
}

function makeFacetFromBooks(books) {
  return {
    authors: [...new Set(books.flatMap((book) => book.authors || []))].map(normalizeOption),
    categories: [...new Set(books.map((book) => book.category).filter(Boolean))].map(normalizeOption),
    publishers: [...new Set(books.map((book) => book.publisher).filter(Boolean))].map(normalizeOption)
  };
}

function sortBooks(books, field) {
  return [...books].sort((left, right) => Number(right[field] || 0) - Number(left[field] || 0)).slice(0, 6);
}

function normalizeCartBook(item = {}, index = 0) {
  if (item.title && !item.bookId) {
    return normalizeBook(item, index);
  }

  return normalizeBook({
    id: item.bookId || item.id,
    title: item.title || item.bookTitle,
    stockAvailable: item.stockAvailable,
    authors: item.authors,
    primaryImageUrl: item.primaryImageUrl
  }, index);
}

function normalizeReview(rawReview = {}) {
  return {
    ...rawReview,
    id: rawReview.id,
    bookId: rawReview.bookId,
    bookTitle: rawReview.bookTitle || rawReview.title || "",
    userId: rawReview.userId,
    userName: rawReview.userName || rawReview.fullName || "Bạn đọc",
    rating: Number(rawReview.rating || 0),
    content: rawReview.content || rawReview.comment || "",
    hidden: Boolean(rawReview.hidden),
    createdAt: rawReview.createdAt || ""
  };
}

function normalizeFine(rawFine = {}) {
  return {
    ...rawFine,
    id: rawFine.id,
    userId: rawFine.userId,
    readerName: rawFine.readerName || rawFine.userName || rawFine.fullName || "-",
    studentCode: rawFine.studentCode || (rawFine.userId ? `USER-${rawFine.userId}` : ""),
    loanId: rawFine.loanId,
    amount: Number(rawFine.amount || 0),
    reason: rawFine.reason || "",
    status: rawFine.status || "UNPAID",
    createdAt: rawFine.createdAt || "",
    paidAt: rawFine.paidAt || ""
  };
}

export const libraryGateway = {
  async login(values) {
    return useBackend(
      async () => {
        const authResponse = await libraryApi.auth.login(values);
        const me = await libraryApi.users.me().catch(() => ({}));

        return {
          ...authResponse,
          id: me?.id || authResponse?.id,
          email: me?.email || authResponse?.email || values.email,
          fullName: me?.fullName || authResponse?.fullName || authResponse?.name || values.email,
          role: me?.role || authResponse?.role || "READER",
          phone: me?.phone || authResponse?.phone || "",
          studentCode: me?.studentCode || authResponse?.studentCode || "",
          kycStatus: normalizeKycStatus(me?.kycStatus || me?.verificationStatus || authResponse?.kycStatus)
        };
      },
      () => mockLibrary.login(values)
    );
  },

  async register(values) {
    return useBackend(
      async () => {
        await libraryApi.auth.register(values);
        return this.login({ email: values.email, password: values.password });
      },
      () => {
        const user = mockLibrary.register(values);
        return { token: `mock-token-${user.id}`, ...user };
      }
    );
  },

  async getUser(userId) {
    return useBackend(
      async () => {
        const [me, kyc] = await Promise.all([
          libraryApi.users.me(),
          libraryApi.users.myKyc().catch(() => null)
        ]);

        return normalizeUser({
          ...me,
          ...(kyc || {}),
          accountEmail: me?.email || ""
        });
      },
      () => normalizeUser(mockLibrary.getUser(userId))
    );
  },

  async listUsers() {
    return useBackend(
      async () => (await libraryApi.users.list()).map(normalizeUser),
      () => mockLibrary.listUsers().map(normalizeUser)
    );
  },

  async listKycUsers() {
    return useBackend(
      async () => {
        const users = await libraryApi.users.kycUsers();
        return Array.isArray(users) ? users.map(normalizeUser) : [];
      },
      () => mockLibrary.listUsers().map(normalizeUser)
    );
  },

  async approveKyc(userId) {
    return useBackend(
      async () => libraryApi.users.approveKyc(userId),
      () => mockLibrary.approveKyc(userId)
    );
  },

  async listPendingKycUsers() {
    return useBackend(
      async () => {
        const users = await libraryApi.users.pendingKyc();
        return Array.isArray(users) ? users.map(normalizeUser) : [];
      },
      () => mockLibrary.listUsers().filter((user) => user.kycStatus === "PENDING").map(normalizeUser)
    );
  },

  async rejectKyc(userId) {
    return useBackend(
      async () => libraryApi.users.rejectKyc(userId),
      () => mockLibrary.rejectKyc(userId)
    );
  },

  async saveMyKyc(userId, values, file, useUpdate = true) {
    const payload = buildKycPayload(values, file);

    if (payload.idCardImageBase64 instanceof Blob) {
      payload.idCardImageBase64 = await fileToDataUrl(payload.idCardImageBase64);
    }

    try {
      if (useUpdate) {
        await libraryApi.users.updateKyc(payload);
      } else {
        await libraryApi.users.submitKyc(payload);
      }

      return this.getUser(userId);
    } catch (backendError) {
      throw backendError;
    }
  },

  async uploadKyc(userId, file) {
    return this.saveMyKyc(userId, {}, file, true);
  },

  async listBooks(filters = {}) {
    return useBackend(
      async () => {
        const hasSearch =
          filters.keyword
          || filters.authorId
          || filters.categoryId
          || filters.publisherId
          || filters.publishYear
          || filters.available !== undefined;
        const pageData = hasSearch
          ? await libraryApi.search.books(filters)
          : await libraryApi.books.list(filters);

        return normalizePage(pageData, filters);
      },
      () => mockLibrary.listBooks(filters)
    );
  },

  async getBook(bookId) {
    return useBackend(
      async () => {
        const [book, reviews] = await Promise.all([
          libraryApi.books.get(bookId),
          libraryApi.reviews.byBook(bookId).catch(() => [])
        ]);

        return normalizeBook({
          ...book,
          reviews: Array.isArray(reviews) ? reviews.map(normalizeReview) : []
        });
      },
      () => mockLibrary.getBook(bookId)
    );
  },

  async getBookMedia(bookId) {
    return useBackend(
      async () => {
        const media = await libraryApi.media.byBook(bookId);
        return Array.isArray(media) ? media.map(normalizeMedia) : [];
      },
      () => []
    );
  },

  async getFacets() {
    return useBackend(
      async () => {
        const [authors, categories, publishers] = await Promise.all([
          libraryApi.authors.list(),
          libraryApi.categories.list(),
          libraryApi.publishers.list()
        ]);

        return {
          authors: authors.map(normalizeOption),
          categories: categories.map(normalizeOption),
          publishers: publishers.map(normalizeOption)
        };
      },
      () => mockLibrary.getFacets()
    );
  },

  async getLeaderboards() {
    return useBackend(
      async () => {
        const page = await libraryApi.books.list({ page: 0, size: 200, sortBy: "createdAt", sortDir: "desc" });
        const books = normalizePage(page).items;

        return {
          borrowed: sortBooks(books, "borrowCount"),
          rated: sortBooks(books, "rating"),
          favorite: sortBooks(books, "favoriteCount")
        };
      },
      () => mockLibrary.getLeaderboards()
    );
  },

  async getFeaturedBooks() {
    return useBackend(
      async () => (await libraryApi.books.featured(6)).map(normalizeBook),
      () => mockLibrary.getFeaturedBooks()
    );
  },

  async toggleWishlist(userId, bookId) {
    return useBackend(
      async () => {
        await libraryApi.wishlists.toggle(userId, bookId);
        const wishlist = await libraryApi.wishlists.list(userId);
        return wishlist.map(normalizeCartBook).map((book) => book.id);
      },
      () => mockLibrary.toggleWishlist(userId, bookId)
    );
  },

  async getWishlist(userId) {
    return useBackend(
      async () => (await libraryApi.wishlists.list(userId)).map(normalizeCartBook),
      () => mockLibrary.getWishlist(userId)
    );
  },

  async addReview(bookId, review) {
    return useBackend(
      async () => normalizeReview(await libraryApi.reviews.create(bookId, {
        userId: review.userId,
        rating: review.rating,
        comment: review.content || review.comment
      })),
      () => mockLibrary.addReview(bookId, review)
    );
  },

  async listReviews() {
    return useBackend(
      async () => (await libraryApi.reviews.listAll()).map(normalizeReview),
      () => mockLibrary.listReviews()
    );
  },

  async setReviewHidden(reviewId, hidden) {
    return useBackend(
      async () => normalizeReview(await libraryApi.reviews.setHidden(reviewId, hidden)),
      () => mockLibrary.setReviewHidden(reviewId, hidden)
    );
  },

  async getCart(userId) {
    return useBackend(
      async () => (await libraryApi.cart.list(userId)).map(normalizeCartBook),
      () => mockLibrary.getCart(userId)
    );
  },

  async addToCart(userId, bookId) {
    return useBackend(
      async () => libraryApi.cart.addBook(userId, bookId),
      () => mockLibrary.addToCart(userId, bookId)
    );
  },

  async removeFromCart(userId, bookId) {
    return useBackend(
      async () => libraryApi.cart.removeBook(userId, bookId),
      () => mockLibrary.removeFromCart(userId, bookId)
    );
  },

  async checkout(userId, values) {
    return useBackend(
      async () => {
        const cart = await libraryApi.cart.list(userId);
        const items = cart
          .map((item) => ({ bookId: item.bookId || item.id, qty: 1 }))
          .filter((item) => item.bookId);

        if (!items.length) {
          throw new Error("Gio muon dang trong.");
        }

        const loanId = await libraryApi.circulation.checkoutOnline(userId, {
          borrowerId: userId,
          dueDays: values.dueDays,
          deliveryMethod: toBackendDeliveryMethod(values.receiveMethod),
          deliveryAddress: values.address,
          deliveryPhone: values.phone,
          items
        });

        await libraryApi.cart.clear(userId).catch(() => {});
        return normalizeLoan({
          id: loanId,
          userId,
          readerName: values.fullName,
          book: cart.map((item) => item.title || item.bookTitle).filter(Boolean).join(", "),
          deliveryMethod: toBackendDeliveryMethod(values.receiveMethod),
          deliveryAddress: values.address,
          deliveryPhone: values.phone,
          status: "PENDING"
        });
      },
      () => mockLibrary.checkout(userId, values)
    );
  },

  async listLoans(userId) {
    return useBackend(
      async () => {
        const loans = userId ? await libraryApi.circulation.history(userId) : await libraryApi.circulation.recent();
        return Array.isArray(loans) ? loans.map((loan) => normalizeLoan(loan)) : [];
      },
      () => mockLibrary.listLoans(userId)
    );
  },

  async moveLoan(loanId, status) {
    return useBackend(
      async () => {
        await libraryApi.loans.updateAdminStatus(loanId, status);
        return normalizeLoan({ id: loanId, status });
      },
      () => mockLibrary.moveLoan(loanId, status)
    );
  },

  async requestReturn(loanId) {
    return useBackend(
      async () => normalizeLoan({ id: await libraryApi.loans.requestReturn(loanId), status: "RETURNING" }),
      () => mockLibrary.moveLoan(loanId, "RETURNING")
    );
  },

  async listFines(userId) {
    return useBackend(
      async () => {
        const fines = userId ? await libraryApi.fines.byUser(userId) : await libraryApi.fines.list();
        return Array.isArray(fines) ? fines.map(normalizeFine) : [];
      },
      () => mockLibrary.listFines(userId)
    );
  },

  async payFine(fineId) {
    return useBackend(
      async () => normalizeFine(await libraryApi.fines.markPaid(fineId)),
      () => mockLibrary.payFine(fineId)
    );
  },

  async collectFine(fineId) {
    return useBackend(
      async () => normalizeFine(await libraryApi.fines.markPaid(fineId)),
      () => mockLibrary.collectFine(fineId)
    );
  },

  async listAddresses(userId) {
    return useBackend(
      async () => libraryApi.addresses.byUser(userId),
      () => []
    );
  },

  async saveAddress(userId, values) {
    return useBackend(
      async () => libraryApi.addresses.save(userId, values),
      () => values
    );
  },

  async removeAddress(addressId) {
    return useBackend(
      async () => libraryApi.addresses.remove(addressId),
      () => null
    );
  },

  async listSystemConfigs() {
    return useBackend(
      async () => libraryApi.systemConfigs.list(),
      () => []
    );
  },

  async saveSystemConfig(key, values) {
    return useBackend(
      async () => libraryApi.systemConfigs.upsert(key, values),
      () => ({ configKey: key, ...values })
    );
  }
};
