import { toAbsoluteMediaUrl } from "./apiClient";
import { libraryApi } from "./libraryApi";

const COVER_TONES = ["#315068", "#5a6f46", "#6f4f7a", "#9a6b35", "#317a59", "#3c6f91", "#8b4f5f"];

async function useBackend(backendCall) {
  try {
    return await backendCall();
  } catch (error) {
    throw error;
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
  const status = rawBook.status || "ACTIVE";

  return {
    id: Number(rawBook.id),
    loanItemId: rawBook.loanItemId,
    copyId: rawBook.copyId,
    copyBarcode: rawBook.copyBarcode || rawBook.barcode || "",
    copyStatus: rawBook.copyStatus || "",
    copyCondition: rawBook.copyCondition || "",
    isbn: rawBook.isbn || "",
    title: rawBook.title || "Sách chưa đặt tên",
    subtitle: rawBook.subtitle || "",
    authors: authors.length ? authors : ["Chưa có tác giả"],
    category,
    publisher: rawBook.publisherName || rawBook.publisher?.name || rawBook.publisher || "Chưa có NXB",
    publishYear: rawBook.publishYear || rawBook.year || "",
    status,
    language: rawBook.language || rawBook.languageCode || "vi",
    pages: rawBook.pages || rawBook.pageCount || 0,
    stockTotal,
    stockAvailable,
    rating: Number(rawBook.rating ?? rawBook.averageRating ?? 0),
    borrowCount: Number(
      rawBook.borrowCount
      ?? rawBook.loanCount
      ?? rawBook.borrowedCount
      ?? rawBook.totalBorrowCount
      ?? 0
    ),
    favoriteCount: Number(rawBook.favoriteCount ?? rawBook.wishlistCount ?? 0),
    featured: Boolean(rawBook.featured),
    coverTone: rawBook.coverTone || COVER_TONES[index % COVER_TONES.length],
    description: rawBook.description || "Chưa có mô tả chi tiết cho đầu sách này.",
    reviews: Array.isArray(rawBook.reviews) ? rawBook.reviews : [],
    primaryImageUrl: rawBook.primaryImageUrl || rawBook.coverUrl || rawBook.imageUrl || ""
  };
}

function resolvePrimaryImageUrl(item = {}) {
  const media = Array.isArray(item.media)
    ? item.media
    : Array.isArray(item.images)
      ? item.images
      : Array.isArray(item.book?.media)
        ? item.book.media
        : Array.isArray(item.book?.images)
          ? item.book.images
          : [];
  const primaryAsset = media.find((asset) => asset.primary || asset.isPrimary) || media[0];

  return item.primaryImageUrl
    || item.coverUrl
    || item.imageUrl
    || item.book?.primaryImageUrl
    || item.book?.coverUrl
    || item.book?.imageUrl
    || primaryAsset?.fileUrl
    || primaryAsset?.url
    || "";
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
    OVERDUE: "OVERDUE",
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
  const firstItemBorrowedAt = Array.isArray(rawLoan.items)
    ? rawLoan.items.find((item) => item?.borrowedAt)?.borrowedAt
    : "";
  const rawItems = Array.isArray(rawLoan.items) ? rawLoan.items : [];
  const loanBooks = Array.isArray(rawLoan.books)
    ? rawLoan.books.map(normalizeBook)
    : rawItems.length
      ? rawItems.flatMap((item) => {
          const quantity = Math.max(1, Number(item.quantity || item.qty || 1));
          return Array.from({ length: quantity }, (_, index) => normalizeBook({
            loanItemId: item.loanItemId,
            id: item.bookId || item.id,
            title: quantity > 1
              ? `${item.bookTitle || item.title || "Sách"} (${index + 1}/${quantity})`
              : item.bookTitle || item.title,
            copyId: item.copyId,
            copyBarcode: item.copyBarcode || item.barcode,
            copyStatus: item.copyStatus,
            copyCondition: item.copyCondition,
            stockAvailable: 1,
            status: item.status
          }));
        })
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
    readerCardCode: rawLoan.readerCardCode || rawLoan.borrowerCardCode || rawLoan.libraryCardCode || "",
    studentCode: rawLoan.studentCode || rawLoan.borrowerStudentCode || rawLoan.idCardNumber || "",
    membershipCode: rawLoan.membershipCode || rawLoan.borrowerMembershipCode || "",
    membershipName: rawLoan.membershipName || rawLoan.borrowerMembershipName || "",
    priorityProcessing: Boolean(rawLoan.priorityProcessing),
    items: rawItems,
    books: loanBooks,
    bookTitle: rawLoan.bookTitle || loanBooks.map((book) => book.title).join(", ") || rawLoan.book || "-",
    receiveMethod,
    address: rawLoan.address || rawLoan.deliveryAddress || "Quầy lưu thông",
    phone: rawLoan.phone || rawLoan.deliveryPhone || "",
    status,
    createdAt: rawLoan.createdAt || rawLoan.borrowDate || rawLoan.createdDate || "",
    loanedAt: rawLoan.loanedAt || rawLoan.borrowedAt || firstItemBorrowedAt || rawLoan.borrowDate || rawLoan.createdAt || rawLoan.createdDate || "",
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

function normalizeCartBook(item = {}, index = 0) {
  const quantity = Number(item.quantity ?? item.qty ?? 1);

  if (item.title && !item.bookId) {
    return {
      ...normalizeBook({
        ...item,
        primaryImageUrl: resolvePrimaryImageUrl(item)
      }, index),
      quantity
    };
  }

  const rawBook = item.book || {};

  return {
    ...normalizeBook({
      id: item.bookId || rawBook.id || item.id,
      title: item.title || item.bookTitle || rawBook.title,
      description: item.description || rawBook.description,
      publisherName: item.publisherName || rawBook.publisherName,
      publisher: item.publisher || rawBook.publisher,
      publishYear: item.publishYear || rawBook.publishYear,
      category: item.category || rawBook.category,
      stockAvailable: item.stockAvailable ?? rawBook.stockAvailable,
      averageRating: item.averageRating ?? rawBook.averageRating,
      rating: item.rating ?? rawBook.rating,
      borrowCount: item.borrowCount ?? rawBook.borrowCount,
      favoriteCount: item.favoriteCount ?? rawBook.favoriteCount,
      loanCount: item.loanCount ?? rawBook.loanCount,
      status: item.status ?? rawBook.status,
      authors: item.authors || rawBook.authors,
      primaryImageUrl: resolvePrimaryImageUrl(item)
    }, index),
    quantity
  };
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
    loanItemId: rawFine.loanItemId,
    bookId: rawFine.bookId,
    bookTitle: rawFine.bookTitle || "",
    copyId: rawFine.copyId,
    copyBarcode: rawFine.copyBarcode || rawFine.barcode || "",
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
          kycStatus: normalizeKycStatus(me?.kycStatus || me?.verificationStatus || authResponse?.kycStatus),
          membershipCode: me?.membershipCode || authResponse?.membershipCode || "FREE",
          membershipName: me?.membershipName || authResponse?.membershipName || "",
          premiumValidUntil: me?.premiumValidUntil || authResponse?.premiumValidUntil || null
        };
      }
    );
  },

  async register(values) {
    return useBackend(
      async () => {
        await libraryApi.auth.register(values);
        return this.login({ email: values.email, password: values.password });
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
      }
    );
  },

  async updateMyAccount(values) {
    return useBackend(
      async () => normalizeUser(await libraryApi.users.updateMe({
        fullName: values.fullName,
        phone: values.phone
      }))
    );
  },

  async changeMyPassword(values) {
    return useBackend(
      async () => libraryApi.users.changeMyPassword(values)
    );
  },

  async listKycUsers() {
    return useBackend(
      async () => {
        const users = await libraryApi.users.kycUsers();
        return Array.isArray(users) ? users.map(normalizeUser) : [];
      }
    );
  },

  async approveKyc(userId) {
    return useBackend(
      async () => libraryApi.users.approveKyc(userId)
    );
  },

  async rejectKyc(userId) {
    return useBackend(
      async () => libraryApi.users.rejectKyc(userId)
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
      }
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
      }
    );
  },

  async getBookMedia(bookId) {
    return useBackend(
      async () => {
        const media = await libraryApi.media.byBook(bookId);
        return Array.isArray(media) ? media.map(normalizeMedia) : [];
      }
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
      }
    );
  },

  async getLeaderboards() {
    return useBackend(
      async () => {
        const data = await libraryApi.books.leaderboards(6);

        return {
          borrowed: (data.borrowed || []).map(normalizeBook),
          rated: (data.rated || []).map(normalizeBook),
          favorite: (data.favorite || []).map(normalizeBook)
        };
      }
    );
  },

  async getFeaturedBooks() {
    return useBackend(
      async () => (await libraryApi.books.featured(6)).map(normalizeBook)
    );
  },

  async getCatalogOverview() {
    return useBackend(
      async () => libraryApi.reports.catalogOverview()
    );
  },

  async getOperationsOverview() {
    return useBackend(
      async () => libraryApi.reports.operationsOverview()
    );
  },

  async toggleWishlist(userId, bookId) {
    return useBackend(
      async () => {
        await libraryApi.wishlists.toggleMine(bookId);
        const wishlist = await libraryApi.wishlists.me();
        return wishlist.map(normalizeCartBook).map((book) => book.id);
      }
    );
  },

  async getWishlist(userId) {
    return useBackend(
      async () => (await libraryApi.wishlists.me()).map(normalizeCartBook)
    );
  },

  async addReview(bookId, review) {
    return useBackend(
      async () => normalizeReview(await libraryApi.reviews.create(bookId, {
        userId: review.userId,
        rating: review.rating,
        comment: review.content || review.comment
      }))
    );
  },

  async listReviews() {
    return useBackend(
      async () => (await libraryApi.reviews.listAll()).map(normalizeReview)
    );
  },

  async setReviewHidden(reviewId, hidden) {
    return useBackend(
      async () => normalizeReview(await libraryApi.reviews.setHidden(reviewId, hidden))
    );
  },

  async getCart(userId) {
    return useBackend(
      async () => (await libraryApi.cart.me()).map(normalizeCartBook)
    );
  },

  async addToCart(userId, bookId) {
    return useBackend(
      async () => libraryApi.cart.addMyBook(bookId)
    );
  },

  async removeFromCart(userId, bookId) {
    return useBackend(
      async () => libraryApi.cart.removeMyBook(bookId)
    );
  },

  async updateCartQuantity(userId, bookId, quantity) {
    return useBackend(
      async () => normalizeCartBook(await libraryApi.cart.updateMyQuantity(bookId, quantity))
    );
  },

  async checkout(userId, values) {
    return useBackend(
      async () => {
        const cart = await libraryApi.cart.me();
        const items = cart
          .map((item) => ({ bookId: item.bookId || item.id, qty: Number(item.quantity || item.qty || 1) }))
          .filter((item) => item.bookId);

        if (!items.length) {
          throw new Error("Gio muon dang trong.");
        }

        const loanId = await libraryApi.loans.checkout({
          borrowerId: userId,
          dueDays: values.dueDays,
          deliveryMethod: toBackendDeliveryMethod(values.receiveMethod),
          address: values.address,
          phone: values.phone,
          items
        });

        await libraryApi.cart.clearMine().catch(() => {});
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
      }
    );
  },

  async listLoans(userId) {
    return useBackend(
      async () => {
        const loans = userId
          ? await libraryApi.circulation.myHistory()
          : await libraryApi.loans.kanban().catch(() => libraryApi.circulation.recent());
        return Array.isArray(loans) ? loans.map((loan) => normalizeLoan(loan)) : [];
      }
    );
  },

  async moveLoan(loanId, status) {
    return useBackend(
      async () => {
        await libraryApi.loans.updateAdminStatus(loanId, status);
        return normalizeLoan({ id: loanId, status });
      }
    );
  },

  async requestReturn(loanId) {
    return useBackend(
      async () => normalizeLoan({ id: await libraryApi.loans.requestReturn(loanId), status: "RETURNING" })
    );
  },

  async confirmReturn(loanId, bookConditions) {
    return useBackend(
      async () => normalizeLoan({
        id: await libraryApi.loans.confirmReturn(loanId, { bookConditions }),
        status: "RETURNED"
      })
    );
  },

  async sendReturnReminder(loanId) {
    return useBackend(
      async () => libraryApi.loans.sendReturnReminder(loanId)
    );
  },

  async listFines(userId) {
    return useBackend(
      async () => {
        const fines = userId ? await libraryApi.fines.mine() : await libraryApi.fines.list();
        return Array.isArray(fines) ? fines.map(normalizeFine) : [];
      }
    );
  },

  async payFine(fineId) {
    return useBackend(
      async () => libraryApi.payments.createFineVnpay(fineId)
    );
  },

  async collectFine(fineId) {
    return useBackend(
      async () => normalizeFine(await libraryApi.fines.markPaid(fineId))
    );
  }
};
