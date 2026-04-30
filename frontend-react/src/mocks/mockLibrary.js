import booksSeed from "./books.json";
import finesSeed from "./fines.json";
import loansSeed from "./loans.json";
import usersSeed from "./users.json";

const STORE_KEY = "bookhub.mock.store.v1";

const STATUS_ORDER = ["NEW", "PACKING", "SHIPPING", "BORROWING", "RETURNED"];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getInitialState() {
  return {
    books: clone(booksSeed),
    users: clone(usersSeed),
    loans: clone(loansSeed),
    fines: clone(finesSeed),
    carts: {}
  };
}

function readStore() {
  if (typeof window === "undefined") {
    return getInitialState();
  }

  const raw = window.localStorage.getItem(STORE_KEY);

  if (!raw) {
    const initial = getInitialState();
    window.localStorage.setItem(STORE_KEY, JSON.stringify(initial));
    return initial;
  }

  try {
    return {
      ...getInitialState(),
      ...JSON.parse(raw)
    };
  } catch {
    const initial = getInitialState();
    window.localStorage.setItem(STORE_KEY, JSON.stringify(initial));
    return initial;
  }
}

function writeStore(store) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
  }
}

function updateStore(mutator) {
  const store = readStore();
  const result = mutator(store);
  writeStore(store);
  return result;
}

function makeId(prefix) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function extractFileName(value) {
  if (!value) {
    return "";
  }

  const sanitizedValue = String(value).split("?")[0].split("#")[0];
  const segments = sanitizedValue.split("/").filter(Boolean);
  return segments[segments.length - 1] || sanitizedValue;
}

function bookMatches(book, filters = {}) {
  const keyword = normalizeText(filters.keyword);

  if (keyword) {
    const haystack = [
      book.title,
      book.subtitle,
      book.isbn,
      book.category,
      book.publisher,
      ...(book.authors || [])
    ].map(normalizeText).join(" ");

    if (!haystack.includes(keyword)) {
      return false;
    }
  }

  if (filters.authorId && !(book.authors || []).includes(filters.authorId)) {
    return false;
  }

  if (filters.categoryId && book.category !== filters.categoryId) {
    return false;
  }

  if (filters.publisherId && book.publisher !== filters.publisherId) {
    return false;
  }

  if (filters.publishYear && Number(book.publishYear) !== Number(filters.publishYear)) {
    return false;
  }

  if (filters.available !== undefined && filters.available !== "") {
    const available = Number(book.stockAvailable || 0) > 0;
    if (String(available) !== String(filters.available)) {
      return false;
    }
  }

  return true;
}

function optionize(values) {
  return [...new Set(values.filter(Boolean))].sort().map((value) => ({
    id: value,
    name: value
  }));
}

function getBookTitles(store, loan) {
  return (loan.bookIds || [])
    .map((bookId) => store.books.find((book) => book.id === bookId)?.title || `Sách #${bookId}`)
    .join(", ");
}

function enrichLoan(store, loan) {
  return {
    ...loan,
    books: (loan.bookIds || []).map((bookId) => store.books.find((book) => book.id === bookId)).filter(Boolean),
    bookTitle: getBookTitles(store, loan)
  };
}

function makeTracking(status, receiveMethod) {
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

  const currentIndex = Math.max(0, STATUS_ORDER.indexOf(status));

  return STATUS_ORDER.map((key, index) => ({
    key,
    label: labels[key],
    time: index <= currentIndex ? today() : "",
    done: index <= currentIndex
  }));
}

export const mockLibrary = {
  reset() {
    const initial = getInitialState();
    writeStore(initial);
    return initial;
  },

  login({ email, password }) {
    const store = readStore();
    const user = store.users.find(
      (item) => normalizeText(item.email) === normalizeText(email) && item.password === password
    );

    if (!user) {
      throw new Error("Email hoặc mật khẩu không đúng trong bộ dữ liệu mock.");
    }

    return {
      token: `mock-token-${user.id}`,
      type: "Bearer",
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      phone: user.phone,
      studentCode: user.studentCode,
      kycStatus: user.kycStatus
    };
  },

  register(values) {
    return updateStore((store) => {
      if (store.users.some((user) => normalizeText(user.email) === normalizeText(values.email))) {
        throw new Error("Email đã tồn tại trong dữ liệu mock.");
      }

      const nextUser = {
        id: Math.max(...store.users.map((user) => user.id)) + 1,
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        role: "READER",
        phone: values.phone || "",
        studentCode: `SV${new Date().getFullYear()}${String(store.users.length + 1).padStart(3, "0")}`,
        status: "ACTIVE",
        kycStatus: "NEW",
        cardCode: "",
        address: "",
        wishlist: [],
        avatarTone: "#466a85",
        kycDocument: null
      };

      store.users.push(nextUser);
      return nextUser;
    });
  },

  getUser(userId) {
    const store = readStore();
    return clone(store.users.find((user) => user.id === Number(userId)));
  },

  updateUser(userId, patch) {
    return updateStore((store) => {
      const user = store.users.find((item) => item.id === Number(userId));
      Object.assign(user, patch);
      return clone(user);
    });
  },

  listUsers() {
    return clone(readStore().users);
  },

  approveKyc(userId) {
    return updateStore((store) => {
      const user = store.users.find((item) => item.id === Number(userId));
      user.kycStatus = "VERIFIED";
      user.cardCode = user.cardCode || `LIB-${user.studentCode}`;
      return clone(user);
    });
  },

  rejectKyc(userId) {
    return updateStore((store) => {
      const user = store.users.find((item) => item.id === Number(userId));
      user.kycStatus = "NEW";
      user.kycDocument = null;
      return clone(user);
    });
  },

  saveMyKyc(userId, payload = {}, fallbackFileName = "mock-cccd.jpg") {
    return updateStore((store) => {
      const user = store.users.find((item) => item.id === Number(userId));

      user.email = payload.email || user.email;
      user.phone = payload.phone || user.phone;
      user.address = payload.address || user.address;
      user.idCardNumber = payload.idCardNumber || user.idCardNumber || "";

      const nextFileUrl = payload.idCardImageUrl || "";
      const nextFileName = extractFileName(nextFileUrl) || fallbackFileName;
      const hasExistingDocument = Boolean(user.kycDocument?.fileName || user.kycDocument?.fileUrl);

      if (nextFileName) {
        user.kycDocument = {
          type: "CCCD/The sinh vien",
          fileName: nextFileName,
          fileUrl: nextFileUrl || user.kycDocument?.fileUrl || "",
          uploadedAt: today()
        };
      } else if (!hasExistingDocument) {
        user.kycDocument = null;
      }

      user.kycStatus = "PENDING";
      return clone(user);
    });
  },

  uploadKyc(userId, fileName = "mock-cccd.jpg") {
    return updateStore((store) => {
      const user = store.users.find((item) => item.id === Number(userId));
      user.kycStatus = "PENDING";
      user.kycDocument = {
        type: "CCCD/Thẻ sinh viên",
        fileName,
        uploadedAt: today()
      };
      return clone(user);
    });
  },

  listBooks(filters = {}) {
    const store = readStore();
    const filtered = store.books.filter((book) => bookMatches(book, filters));
    const page = Number(filters.page || 0);
    const size = Number(filters.size || filtered.length || 12);
    const start = page * size;

    return {
      items: clone(filtered.slice(start, start + size)),
      totalItems: filtered.length,
      totalPages: Math.ceil(filtered.length / size),
      page,
      size
    };
  },

  getBook(bookId) {
    const book = readStore().books.find((item) => item.id === Number(bookId));
    return clone(book);
  },

  getFacets() {
    const books = readStore().books;

    return {
      authors: optionize(books.flatMap((book) => book.authors || [])),
      categories: optionize(books.map((book) => book.category)),
      publishers: optionize(books.map((book) => book.publisher))
    };
  },

  getLeaderboards() {
    const books = readStore().books;

    return {
      borrowed: clone([...books].sort((a, b) => b.borrowCount - a.borrowCount).slice(0, 6)),
      rated: clone([...books].sort((a, b) => b.rating - a.rating).slice(0, 6)),
      favorite: clone([...books].sort((a, b) => b.favoriteCount - a.favoriteCount).slice(0, 6))
    };
  },

  getFeaturedBooks() {
    return clone(readStore().books.filter((book) => book.featured).slice(0, 5));
  },

  toggleWishlist(userId, bookId) {
    return updateStore((store) => {
      const user = store.users.find((item) => item.id === Number(userId));
      user.wishlist = Array.isArray(user.wishlist) ? user.wishlist : [];
      const numericBookId = Number(bookId);

      if (user.wishlist.includes(numericBookId)) {
        user.wishlist = user.wishlist.filter((id) => id !== numericBookId);
      } else {
        user.wishlist.push(numericBookId);
      }

      return clone(user.wishlist);
    });
  },

  getWishlist(userId) {
    const store = readStore();
    const user = store.users.find((item) => item.id === Number(userId));
    return clone((user?.wishlist || []).map((bookId) => store.books.find((book) => book.id === bookId)).filter(Boolean));
  },

  addReview(bookId, review) {
    return updateStore((store) => {
      const book = store.books.find((item) => item.id === Number(bookId));
      const nextReview = {
        id: makeId("RV"),
        userId: review.userId,
        userName: review.userName,
        rating: Number(review.rating || 5),
        content: review.content,
        createdAt: today(),
        hidden: false
      };

      book.reviews = [nextReview, ...(book.reviews || [])];
      const visibleReviews = book.reviews.filter((item) => !item.hidden);
      book.rating = Number(
        (visibleReviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / visibleReviews.length).toFixed(1)
      );
      return clone(nextReview);
    });
  },

  listReviews() {
    const store = readStore();
    return clone(store.books.flatMap((book) =>
      (book.reviews || []).map((review) => ({
        ...review,
        bookId: book.id,
        bookTitle: book.title
      }))
    ));
  },

  setReviewHidden(reviewId, hidden) {
    return updateStore((store) => {
      store.books.forEach((book) => {
        const review = (book.reviews || []).find((item) => item.id === reviewId);
        if (review) {
          review.hidden = hidden;
        }
      });
    });
  },

  getCart(userId) {
    const store = readStore();
    const ids = store.carts?.[userId] || [];
    return clone(ids.map((bookId) => store.books.find((book) => book.id === bookId)).filter(Boolean));
  },

  addToCart(userId, bookId) {
    return updateStore((store) => {
      store.carts[userId] = store.carts[userId] || [];
      const numericBookId = Number(bookId);
      if (!store.carts[userId].includes(numericBookId)) {
        store.carts[userId].push(numericBookId);
      }
      return clone(store.carts[userId]);
    });
  },

  removeFromCart(userId, bookId) {
    return updateStore((store) => {
      store.carts[userId] = (store.carts[userId] || []).filter((id) => id !== Number(bookId));
      return clone(store.carts[userId]);
    });
  },

  checkout(userId, values) {
    return updateStore((store) => {
      const user = store.users.find((item) => item.id === Number(userId));
      const bookIds = [...(store.carts[userId] || [])];

      if (!bookIds.length) {
        throw new Error("Giỏ mượn đang trống.");
      }

      const status = values.receiveMethod === "DELIVERY" ? "NEW" : "PACKING";
      const loan = {
        id: makeId("ORD"),
        userId: Number(userId),
        readerName: user.fullName,
        bookIds,
        receiveMethod: values.receiveMethod,
        address: values.receiveMethod === "DELIVERY" ? values.address : "Quầy lưu thông",
        phone: values.phone || user.phone,
        status,
        createdAt: today(),
        dueDate: addDays(Number(values.dueDays || 14)),
        deliveryFee: values.receiveMethod === "DELIVERY" ? 18000 : 0,
        tracking: makeTracking(status, values.receiveMethod)
      };

      store.loans.unshift(loan);
      store.carts[userId] = [];
      bookIds.forEach((bookId) => {
        const book = store.books.find((item) => item.id === bookId);
        if (book) {
          book.stockAvailable = Math.max(0, Number(book.stockAvailable || 0) - 1);
          book.borrowCount = Number(book.borrowCount || 0) + 1;
        }
      });
      return clone(enrichLoan(store, loan));
    });
  },

  listLoans(userId) {
    const store = readStore();
    const loans = userId ? store.loans.filter((loan) => loan.userId === Number(userId)) : store.loans;
    return clone(loans.map((loan) => enrichLoan(store, loan)));
  },

  moveLoan(loanId, status) {
    return updateStore((store) => {
      const loan = store.loans.find((item) => item.id === loanId);
      loan.status = status;
      loan.tracking = makeTracking(status, loan.receiveMethod);
      return clone(enrichLoan(store, loan));
    });
  },

  listFines(userId) {
    const store = readStore();
    const fines = userId ? store.fines.filter((fine) => fine.userId === Number(userId)) : store.fines;
    return clone(fines);
  },

  payFine(fineId) {
    return updateStore((store) => {
      const fine = store.fines.find((item) => item.id === fineId);
      fine.status = "PAID";
      fine.paidAt = today();
      return clone(fine);
    });
  },

  collectFine(fineId) {
    return this.payFine(fineId);
  }
};
