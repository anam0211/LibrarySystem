import { escapeHtml, formatDate, formatNumber } from "../../../shared/utils/format.js";

export const bookDetailMeta = {
  title: "Chi tiết sách",
  description: "Trang chi tiết sách công khai với thông tin đầy đủ, file đính kèm và preview PDF."
};

export function createBookDetailPageState() {
  return {
    bookId: null,
    message: ""
  };
}

function isImageAsset(asset) {
  return ["JPG", "JPEG", "PNG", "WEBP"].includes(String(asset?.assetType || "").toUpperCase());
}

function isPdfAsset(asset) {
  return String(asset?.assetType || "").toUpperCase() === "PDF";
}

function renderAssetCard(asset) {
  return `
    <article class="book-asset-card">
      <div class="book-asset-preview">
        ${isImageAsset(asset)
          ? `<img src="${escapeHtml(asset.fileUrl)}" alt="${escapeHtml(asset.fileName)}" class="book-asset-image">`
          : `<div class="book-asset-fallback">${escapeHtml(asset.assetType)}</div>`}
      </div>
      <div class="book-asset-body">
        <div class="list-item-head">
          <strong>${escapeHtml(asset.fileName)}</strong>
          <span class="pill">${asset.primary ? "Bìa" : asset.assetType}</span>
        </div>
        <p class="mini">${formatDate(asset.createdAt)}</p>
        <div class="actions">
          <a class="action-link" href="${escapeHtml(asset.fileUrl)}" target="_blank" rel="noreferrer">Mở file</a>
          <a class="action-link" href="${escapeHtml(asset.fileUrl)}" download>Tải xuống</a>
        </div>
      </div>
    </article>
  `;
}

function renderPdfPreview(asset) {
  return `
    <article class="table-card storefront-panel">
      <div class="section-head">
        <div>
          <p class="eyebrow">PDF xem trước</p>
          <h3 class="card-title">${escapeHtml(asset.fileName)}</h3>
        </div>
        <div class="actions">
          <a class="action-link" href="${escapeHtml(asset.fileUrl)}" target="_blank" rel="noreferrer">Mở file</a>
          <a class="action-link" href="${escapeHtml(asset.fileUrl)}" download>Tải xuống</a>
        </div>
      </div>
      <div class="media-preview-frame">
        <iframe src="${escapeHtml(asset.fileUrl)}" title="${escapeHtml(asset.fileName)}" class="media-preview-embed" loading="lazy"></iframe>
      </div>
    </article>
  `;
}

export function renderBookDetailPage(store, pageState) {
  const detail = store.getPublicBookDetail();
  const book = detail.book;
  const media = Array.isArray(detail.media) ? detail.media : [];

  if (!book) {
    return `
      <div class="page-state-card is-error">
        <p class="eyebrow">Không tìm thấy sách</p>
        <h3>Trang chi tiết hiện chưa có dữ liệu</h3>
        <p class="subtle">${escapeHtml(pageState.message || "Không thể tải thông tin sách từ backend.")}</p>
        <div class="actions">
          <button class="btn secondary" type="button" data-page="home">Về trang chủ</button>
        </div>
      </div>
    `;
  }

  const coverAsset = media.find((asset) => asset.primary) || null;
  const extraAssets = media.filter((asset) => !asset.primary);
  const imageAssets = extraAssets.filter(isImageAsset);
  const pdfAssets = extraAssets.filter(isPdfAsset);
  const otherAssets = extraAssets.filter((asset) => !isImageAsset(asset) && !isPdfAsset(asset));

  return `
    <section class="table-card storefront-panel">
      <div class="section-head">
        <div>
          <p class="eyebrow">Chi tiết sách</p>
          <h2>${escapeHtml(book.title)}</h2>
          <p class="subtle">${escapeHtml(book.authorNames || "Chưa có tác giả")} / ${escapeHtml(book.publisherName || "Chưa có nhà xuất bản")}</p>
        </div>
        <div class="actions">
          <button class="btn secondary" type="button" data-page="home">Về trang chủ</button>
          <button class="btn secondary public-placeholder-btn" type="button" disabled>Đặt sách</button>
        </div>
      </div>

      <div class="book-detail-shell">
        <div class="book-cover-panel">
          ${coverAsset?.fileUrl || book.primaryImageUrl
            ? `<img src="${escapeHtml(coverAsset?.fileUrl || book.primaryImageUrl)}" alt="${escapeHtml(book.title)}" class="book-cover-image">`
            : '<div class="book-cover-fallback">Chưa có ảnh bìa</div>'}
        </div>

        <div class="stack">
          <div class="detail-grid">
            <div class="detail-item"><p class="eyebrow">ISBN</p><strong>${escapeHtml(book.isbn || "-")}</strong></div>
            <div class="detail-item"><p class="eyebrow">Năm xuất bản</p><strong>${escapeHtml(book.publishYear || "-")}</strong></div>
            <div class="detail-item"><p class="eyebrow">Thể loại</p><strong>${escapeHtml((book.categories || []).map((category) => category.name).join(", ") || "Chưa có")}</strong></div>
            <div class="detail-item"><p class="eyebrow">Tồn kho</p><strong>${formatNumber(book.stockAvailable)} / ${formatNumber(book.stockTotal)}</strong></div>
            <div class="detail-item"><p class="eyebrow">Ngôn ngữ</p><strong>${escapeHtml(book.languageCode || "-")}</strong></div>
            <div class="detail-item"><p class="eyebrow">Số trang</p><strong>${formatNumber(book.pageCount || 0)}</strong></div>
          </div>

          <div class="chip-card">
            <h4>Mô tả</h4>
            <p class="subtle">${escapeHtml(book.description || "Chưa có mô tả chi tiết cho đầu sách này.")}</p>
          </div>

          <div class="chip-card">
            <h4>Từ khóa</h4>
            <p class="subtle">${escapeHtml(book.keywords || "Chưa có từ khóa.")}</p>
          </div>

          <div class="chip-card">
            <h4>Tài liệu đính kèm</h4>
            <p class="subtle">${extraAssets.length ? `${formatNumber(extraAssets.length)} file đang gắn với đầu sách này.` : "Hiện chưa có file đính kèm công khai."}</p>
          </div>
        </div>
      </div>
    </section>

    ${pdfAssets.map(renderPdfPreview).join("")}

    ${imageAssets.length
      ? `
        <section class="table-card storefront-panel">
          <div class="section-head">
            <div>
              <p class="eyebrow">Hình ảnh bổ sung</p>
              <h3 class="card-title">${formatNumber(imageAssets.length)} ảnh đính kèm</h3>
            </div>
          </div>
          <div class="book-asset-grid">
            ${imageAssets.map(renderAssetCard).join("")}
          </div>
        </section>
      `
      : ""}

    ${otherAssets.length
      ? `
        <section class="table-card storefront-panel">
          <div class="section-head">
            <div>
              <p class="eyebrow">Tệp tải xuống</p>
              <h3 class="card-title">${formatNumber(otherAssets.length)} file khác</h3>
            </div>
          </div>
          <div class="book-asset-grid">
            ${otherAssets.map(renderAssetCard).join("")}
          </div>
        </section>
      `
      : ""}
  `;
}
