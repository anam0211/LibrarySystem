import {
  ApartmentOutlined,
  BookOutlined,
  ShoppingCartOutlined,
  StarFilled
} from "@ant-design/icons";
import { Button } from "antd";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toAbsoluteMediaUrl } from "../api/apiClient";
import { formatNumber } from "./formatters";

function getAuthors(book = {}) {
  if (Array.isArray(book.authors) && book.authors.length) {
    return book.authors
      .map((author) => (typeof author === "string" ? author : author?.name))
      .filter(Boolean)
      .join(", ");
  }

  return book.author || book.authorName || "Chưa có tác giả";
}

function getDescription(book = {}) {
  return (
    book.shortDescription
    || book.description
    || "Khám phá đầu sách này và thêm vào giỏ mượn khi bạn cần đọc tiếp."
  );
}

function getCoverUrl(book = {}) {
  return toAbsoluteMediaUrl(
    book.coverImage
    || book.primaryImageUrl
    || book.coverUrl
    || book.imageUrl
    || ""
  );
}

function getPublisher(book = {}) {
  return book.publisherName || book.publisher?.name || book.publisher || "Chưa có NXB";
}

function getAvailability(book = {}) {
  if (book.status === "ARCHIVED") {
    return "Ngừng mượn";
  }

  if (book.availabilityStatus) {
    return book.availabilityStatus;
  }

  return Number(book.stockAvailable || 0) > 0 ? "Còn sách" : "Hết sách";
}

function getBorrowCount(book = {}) {
  return Number(
    book.borrowCount
    ?? book.loanCount
    ?? book.borrowedCount
    ?? book.totalBorrowCount
    ?? 0
  );
}

export function BookCover({ book }) {
  const coverUrl = getCoverUrl(book);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [coverUrl]);

  if (coverUrl && !imageFailed) {
    return (
      <img
        src={coverUrl}
        alt={book.title || "Bìa sách"}
        className="book-card-cover-image"
        loading="lazy"
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <div className="book-card-cover-placeholder" style={{ "--cover-tone": book.coverTone }}>
      <span>{book.category || "BookHub"}</span>
      <strong>{book.title || "Sách BookHub"}</strong>
    </div>
  );
}

export function BookRatingInfo({ book }) {
  const rating = Number(book.averageRating ?? book.rating ?? 0);
  const borrowCount = getBorrowCount(book);

  return (
    <div className="book-card-rating">
      <span className="book-card-rating-score">
        <StarFilled />
        {rating ? rating.toFixed(1) : "0.0"}
      </span>
      <span className="book-card-rating-separator">·</span>
      <span>{formatNumber(borrowCount)} lượt mượn</span>
    </div>
  );
}

export function BookMeta({ book }) {
  const publishYear = book.publishYear || book.year || "Đang cập nhật";
  const publisher = getPublisher(book);
  const metaText = `${publisher} * Năm XB: ${publishYear}`;

  return (
    <div className="book-card-meta">
      <span className="book-card-meta-item" title={metaText}>
        <span className="book-card-meta-icon" aria-hidden="true">
          <ApartmentOutlined />
        </span>
        <span className="book-card-meta-label">{metaText}</span>
      </span>
    </div>
  );
}

export function BookActionButton({
  available,
  loading,
  added,
  label = "Thêm vào giỏ",
  addedLabel = "Đã thêm",
  onClick
}) {
  return (
    <Button
      type="primary"
      size="large"
      block
      className="book-card-cta"
      icon={<ShoppingCartOutlined />}
      disabled={!available || added}
      loading={loading}
      onClick={onClick}
    >
      {added ? addedLabel : label}
    </Button>
  );
}

export default function BookCard({
  book,
  onAction,
  actionLabel = "Thêm vào giỏ",
  addedLabel = "Đã thêm",
  className = ""
}) {
  const availabilityLabel = getAvailability(book);
  const available = book?.status !== "ARCHIVED" && (
    Number(book?.stockAvailable || 0) > 0 || availabilityLabel === "Còn sách"
  );
  const [status, setStatus] = useState("idle");

  async function handleAction(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!onAction) {
      return;
    }

    setStatus("loading");
    try {
      const result = await onAction(book);
      if (result === false) {
        setStatus("idle");
        return;
      }

      setStatus("added");
      window.setTimeout(() => setStatus("idle"), 700);
    } catch {
      setStatus("idle");
    }
  }

  return (
    <article className={`book-card ${className}`.trim()}>
      <Link to={`/book/${book.id}`} className="book-card-cover-link" aria-label={`Xem ${book.title}`}>
        <BookCover book={book} />
      </Link>

      <div className="book-card-content">
        <div className="book-card-kicker">
          <BookOutlined />
          <span>{book.category || "Kho sách"}</span>
        </div>

        <Link to={`/book/${book.id}`} className="book-card-title-link">
          <h3 className="book-card-title">{book.title || "Sách chưa đặt tên"}</h3>
        </Link>

        <p className="book-card-author">{getAuthors(book)}</p>
        <p className="book-card-description">{getDescription(book)}</p>

        <BookRatingInfo book={book} />
        <BookMeta book={book} />
      </div>

      <div className="book-card-action">
        <BookActionButton
          available={available}
          loading={status === "loading"}
          added={status === "added"}
          label={available ? actionLabel : availabilityLabel}
          addedLabel={addedLabel}
          onClick={handleAction}
        />
      </div>
    </article>
  );
}
