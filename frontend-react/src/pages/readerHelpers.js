import { useEffect, useState } from "react";
import { libraryGateway } from "../api/libraryGateway";

export const READER_QR_TTL_MS = 60000;

export const STATUS_META = {
  NEW: ["default", "Chờ duyệt"],
  PACKING: ["cyan", "Cần giao"],
  SHIPPING: ["blue", "Đang giao"],
  BORROWING: ["green", "Đang mượn"],
  RETURNING: ["purple", "Chờ nhận trả"],
  CHECKING: ["orange", "Đang kiểm tra"],
  RETURNED: ["green", "Hoàn tất"],
  OVERDUE: ["red", "Quá hạn"],
  CANCELLED: ["red", "Đã hủy"]
};

export function isDeliveryLoan(loan) {
  return loan.receiveMethod === "DELIVERY" || loan.deliveryMethod === "HOME_DELIVERY";
}

function getDateOnly(value) {
  if (!value) return null;
  const parsed = new Date(String(value).includes("T") ? value : `${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function todayStart() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function isOverdue(loan) {
  if (loan.status === "OVERDUE") return true;
  if (loan.status !== "BORROWING") return false;
  const dueDate = getDateOnly(loan.dueDate);
  return dueDate ? dueDate < todayStart() : false;
}

export function isDueSoon(loan) {
  if (loan.status !== "BORROWING" || isOverdue(loan)) return false;
  const dueDate = getDateOnly(loan.dueDate);
  if (!dueDate) return false;
  const tomorrow = todayStart();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return dueDate <= tomorrow;
}

export function readerLoanStatus(loan) {
  return isOverdue(loan) ? "OVERDUE" : loan.status;
}

export function bookCountText(loan) {
  const count = Array.isArray(loan.books) && loan.books.length ? loan.books.length : 1;
  return `${count} cuốn`;
}

export function loanedDateValue(loan) {
  if (loan?.loanedAt || loan?.createdAt) {
    return loan.loanedAt || loan.createdAt;
  }

  if (loan?.dueDate) {
    const dueDate = getDateOnly(loan.dueDate);
    if (dueDate) {
      dueDate.setDate(dueDate.getDate() - 14);
      return dueDate.toISOString();
    }
  }

  return "";
}

export function buildReaderQrToken(userId, issuedAt) {
  const slot = Math.floor(issuedAt / READER_QR_TTL_MS);
  return `LIBRARY_READER|user_id=${userId || ""}|slot=${slot}`;
}

export function formatQrTime(value) {
  return new Date(value).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function isImageMedia(asset) {
  return ["PNG", "JPG", "JPEG", "WEBP", "GIF"].includes(String(asset?.assetType || "").toUpperCase());
}

async function attachFavoriteBookCovers(books) {
  return Promise.all(
    books.map(async (book) => {
      if (book.primaryImageUrl) {
        return book;
      }

      try {
        const media = await libraryGateway.getBookMedia(book.id);
        const coverAsset = media.find((asset) => asset.primary && isImageMedia(asset)) || media.find(isImageMedia);
        return { ...book, primaryImageUrl: coverAsset?.fileUrl || "" };
      } catch {
        return book;
      }
    })
  );
}

export function useReaderData(session) {
  const [user, setUser] = useState(null);
  const [loans, setLoans] = useState([]);
  const [fines, setFines] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  async function loadReader() {
    if (!session?.id) return;
    const [nextUser, nextLoans, nextFines, nextWishlist] = await Promise.all([
      libraryGateway.getUser(session.id),
      libraryGateway.listLoans(session.id),
      libraryGateway.listFines(session.id),
      libraryGateway.getWishlist(session.id)
    ]);
    setUser(nextUser);
    setLoans(nextLoans);
    setFines(nextFines);
    setWishlist(await attachFavoriteBookCovers(nextWishlist));
    return nextUser;
  }

  useEffect(() => {
    loadReader();
  }, [session?.id]);

  return { user, setUser, loans, fines, wishlist, loadReader };
}
