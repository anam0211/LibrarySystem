import { escapeHtml, formatDate, formatNumber, truncate } from "../../../shared/utils/format.js";
import { scrollToElement } from "../../../shared/utils/scroll.js";

export const booksMeta = {
  title: "Sách",
  description: "Quản lý sách, tồn kho."
};

const STATUS_OPTIONS = ["ACTIVE", "ARCHIVED"];
const SORT_OPTIONS = [
  { value: "createdAt", label: "Mới nhất" },
  { value: "title", label: "Tên sách" },
  { value: "publishYear", label: "Năm xuất bản" },
  { value: "stockAvailable", label: "Tồn kho khả dụng" }
];

function getDefaultFormValue() {
  return {
    id: "",
    isbn: "",
    title: "",
    subtitle: "",
    publisherId: "",
    publishYear: new Date().getFullYear(),
    languageCode: "vi",
    pageCount: "",
    description: "",
    keywords: "",
    stockTotal: 1,
    stockAvailable: 1,
    status: "ACTIVE",
    authorIds: [],
    categoryIds: []
  };
}

function mapBookToForm(book) {
  return {
    id: String(book.id),
    isbn: book.isbn || "",
    title: book.title || "",
    subtitle: book.subtitle || "",
    publisherId: book.publisherId ? String(book.publisherId) : "",
    publishYear: book.publishYear || "",
    languageCode: book.languageCode || "",
    pageCount: book.pageCount || "",
    description: book.description || "",
    keywords: book.keywords || "",
    stockTotal: book.stockTotal ?? 0,
    stockAvailable: book.stockAvailable ?? 0,
    status: book.status || "ACTIVE",
    authorIds: (book.authors || []).map((author) => String(author.id)),
    categoryIds: (book.categories || []).map((category) => String(category.id))
  };
}

function renderMediaAssetCard(asset) {
  const isImage = ["JPG", "JPEG", "PNG", "WEBP"].includes(asset.assetType);

  return `
    <article class="book-asset-card">
      <div class="book-asset-preview">
        ${isImage
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
          <a class="action-link" href="${escapeHtml(asset.fileUrl)}" target="_blank" rel="noreferrer">Mở</a>
          <button class="action-link danger" type="button" data-action="books-remove-media" data-id="${asset.id}">Xóa</button>
        </div>
      </div>
    </article>
  `;
}

function renderBookThumbnail(book) {
  if (book.primaryImageUrl) {
    return `<img src="${escapeHtml(book.primaryImageUrl)}" alt="${escapeHtml(book.title)}" class="table-cover-thumb">`;
  }

  return `<div class="table-cover-thumb table-cover-thumb-fallback">No image</div>`;
}

function renderMultiSelectField({ label, name, options, selectedIds, placeholder }) {
  const selectedOptions = options.filter((option) => selectedIds.includes(String(option.id)));
  const selectedLabel = selectedOptions.length
    ? truncate(selectedOptions.map((option) => option.name).join(", "), 72)
    : placeholder;

  return `
    <div class="field span-2">
      <label>${escapeHtml(label)}</label>
      <details class="multi-select-field">
        <summary class="multi-select-summary">
          <span class="multi-select-value ${selectedOptions.length ? "" : "is-placeholder"}">${escapeHtml(selectedLabel)}</span>
          <span class="multi-select-chevron" aria-hidden="true"></span>
        </summary>
        <div class="multi-select-panel">
          ${options.map((option) => `
            <label class="multi-select-option">
              <input
                type="checkbox"
                name="${escapeHtml(name)}"
                value="${option.id}"
                ${selectedIds.includes(String(option.id)) ? "checked" : ""}
              >
              <span>${escapeHtml(option.name)}</span>
            </label>
          `).join("")}
        </div>
      </details>
      <p class="mini">Có thể chọn nhiều mục.</p>
    </div>
  `;
}

export function createBooksPageState() {
  return {
    keyword: "",
    categoryId: "",
    authorId: "",
    publisherId: "",
    available: "",
    sortBy: "createdAt",
    sortDir: "desc",
    page: 0,
    size: 10,
    selectedId: null,
    form: getDefaultFormValue(),
    message: "",
    scrollTarget: ""
  };
}

export function renderBooksPage(store, pageState) {
  const booksPage = store.getBookPage();
  const books = booksPage.items;
  const authors = store.getAuthors();
  const categories = store.getCategories();
  const publishers = store.getPublishers();
  const selectedBook = store.getBookById(pageState.selectedId) || books[0] || null;
  const selectedBookMedia = selectedBook ? store.getMediaByBookId(selectedBook.id) : [];
  const selectedBookCover = selectedBookMedia.find((asset) => asset.primary) || null;
  const selectedAuthorIds = pageState.form.authorIds.map(String);
  const selectedCategoryIds = pageState.form.categoryIds.map(String);
  const pageStart = booksPage.totalItems ? pageState.page * booksPage.size + 1 : 0;
  const pageEnd = booksPage.totalItems ? pageStart + books.length - 1 : 0;
  const lowStockCount = books.filter((book) => book.stockAvailable <= 2).length;

  return `
    <div class="section-head">
      <div>
        <p class="eyebrow">Catalog sách</p>
        <h2>Quản lý sách, ảnh bìa và file đính kèm</h2>
      </div>
      <div class="actions">
        <button class="btn secondary" type="button" data-action="books-reset-filters">Đặt lại bộ lọc</button>
        <button class="btn primary" type="button" data-action="books-new">Tạo sách</button>
      </div>
    </div>

    <div class="grid-3">
      <div class="chip-card">
        <p class="eyebrow">Tổng kết quả</p>
        <h3 class="card-title">${formatNumber(booksPage.totalItems)}</h3>
        <p class="subtle">Số bản ghi đang trả về từ backend.</p>
      </div>
      <div class="chip-card">
        <p class="eyebrow">Trang hiện tại</p>
        <h3 class="card-title">${formatNumber(booksPage.page + 1)} / ${formatNumber(Math.max(booksPage.totalPages, 1))}</h3>
        <p class="subtle">Đang hiển thị ${formatNumber(pageStart)} - ${formatNumber(pageEnd)}.</p>
      </div>
      <div class="chip-card">
        <p class="eyebrow">Sắp hết sách</p>
        <h3 class="card-title">${formatNumber(lowStockCount)}</h3>
        <p class="subtle">Đầu sách có tồn khả dụng nhỏ hơn hoặc bằng 2 ở trang này.</p>
      </div>
    </div>

    <div class="table-card">
      <form id="books-filter-form" class="filter-grid">
        <div class="field">
          <label for="books-keyword">Từ khóa</label>
          <input id="books-keyword" name="keyword" type="text" value="${escapeHtml(pageState.keyword)}" placeholder="Tên sách, ISBN hoặc từ khóa">
        </div>
        <div class="field">
          <label for="books-author">Tác giả</label>
          <select id="books-author" name="authorId">
            <option value="">Tất cả tác giả</option>
            ${authors
              .map(
                (author) => `<option value="${author.id}" ${String(pageState.authorId) === String(author.id) ? "selected" : ""}>${escapeHtml(author.name)}</option>`
              )
              .join("")}
          </select>
        </div>
        <div class="field">
          <label for="books-category">Danh mục</label>
          <select id="books-category" name="categoryId">
            <option value="">Tất cả danh mục</option>
            ${categories
              .map(
                (category) => `<option value="${category.id}" ${String(pageState.categoryId) === String(category.id) ? "selected" : ""}>${escapeHtml(category.name)}</option>`
              )
              .join("")}
          </select>
        </div>
        <div class="field">
          <label for="books-publisher">Nhà xuất bản</label>
          <select id="books-publisher" name="publisherId">
            <option value="">Tất cả nhà xuất bản</option>
            ${publishers
              .map(
                (publisher) => `<option value="${publisher.id}" ${String(pageState.publisherId) === String(publisher.id) ? "selected" : ""}>${escapeHtml(publisher.name)}</option>`
              )
              .join("")}
          </select>
        </div>
        <div class="field">
          <label for="books-available">Tình trạng</label>
          <select id="books-available" name="available">
            <option value="" ${pageState.available === "" ? "selected" : ""}>Tất cả</option>
            <option value="true" ${pageState.available === "true" ? "selected" : ""}>Còn sách</option>
            <option value="false" ${pageState.available === "false" ? "selected" : ""}>Hết sách</option>
          </select>
        </div>
        <div class="field">
          <label for="books-sort-by">Sắp xếp theo</label>
          <select id="books-sort-by" name="sortBy">
            ${SORT_OPTIONS
              .map((item) => `<option value="${item.value}" ${pageState.sortBy === item.value ? "selected" : ""}>${item.label}</option>`)
              .join("")}
          </select>
        </div>
        <div class="field">
          <label for="books-sort-dir">Thứ tự</label>
          <select id="books-sort-dir" name="sortDir">
            <option value="desc" ${pageState.sortDir === "desc" ? "selected" : ""}>Giảm dần</option>
            <option value="asc" ${pageState.sortDir === "asc" ? "selected" : ""}>Tăng dần</option>
          </select>
        </div>
        <div class="field">
          <label for="books-size">Kích thước trang</label>
          <select id="books-size" name="size">
            ${[10, 20, 50]
              .map((size) => `<option value="${size}" ${Number(pageState.size) === size ? "selected" : ""}>${size}</option>`)
              .join("")}
          </select>
        </div>
        <div class="field field-submit">
          <label>&nbsp;</label>
          <button class="btn primary" type="submit">Áp dụng</button>
        </div>
      </form>
    </div>

    <div class="book-admin-grid">
      <details class="table-card accordion-card" open>
        <summary class="accordion-summary">
          <div>
            <p class="eyebrow">Danh sách sách</p>
            <h3 class="card-title">${formatNumber(books.length)} bản ghi trên trang này</h3>
          </div>
          <span class="accordion-icon" aria-hidden="true"></span>
        </summary>
        <div class="accordion-content">
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Ảnh</th>
                <th>Sách</th>
                <th>Nhà xuất bản</th>
                <th>Tồn kho</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              ${books.length
                ? books
                    .map(
                      (book) => `
                        <tr class="${selectedBook?.id === book.id ? "row-selected" : ""}" id="book-row-${book.id}">
                          <td>${renderBookThumbnail(book)}</td>
                          <td>
                            <strong>${escapeHtml(book.title)}</strong>
                            <p class="mini">${escapeHtml(book.authorNames || "Chưa có tác giả")}</p>
                            <p class="mini">${escapeHtml(book.primaryCategoryName || "Chưa có danh mục")} / ${escapeHtml(book.isbn || "-")}</p>
                          </td>
                          <td>${escapeHtml(book.publisherName || "-")}</td>
                          <td>${formatNumber(book.stockAvailable)} / ${formatNumber(book.stockTotal)}</td>
                          <td><span class="status info">${escapeHtml(book.status || "-")}</span></td>
                          <td>
                            <div class="actions">
                              <button class="action-link" type="button" data-action="books-select" data-id="${book.id}">Xem</button>
                              <button class="action-link" type="button" data-action="books-edit" data-id="${book.id}">Sửa</button>
                              <button class="action-link danger" type="button" data-action="books-delete" data-id="${book.id}">Xóa</button>
                            </div>
                          </td>
                        </tr>
                      `
                    )
                    .join("")
                : '<tr><td colspan="6" class="table-empty">Không có sách phù hợp với bộ lọc hiện tại.</td></tr>'}
            </tbody>
          </table>
        </div>
        <div class="catalog-pagination">
          <button class="action-link" type="button" data-action="books-prev-page" ${booksPage.first ? "disabled" : ""}>Trang trước</button>
          <button class="action-link" type="button" data-action="books-next-page" ${booksPage.last ? "disabled" : ""}>Trang sau</button>
        </div>
        </div>
      </details>

      <div id="books-detail-section" class="table-card">
        <div class="section-head">
          <div>
            <p class="eyebrow">Chi tiết sách</p>
            <h3 class="card-title">${selectedBook ? escapeHtml(selectedBook.title) : "Chưa chọn sách"}</h3>
          </div>
        </div>
        ${selectedBook
          ? `
            <div class="book-detail-shell">
              <div class="book-cover-panel">
                ${selectedBookCover
                  ? `<img src="${escapeHtml(selectedBookCover.fileUrl)}" alt="${escapeHtml(selectedBook.title)}" class="book-cover-image">`
                  : selectedBook.primaryImageUrl
                    ? `<img src="${escapeHtml(selectedBook.primaryImageUrl)}" alt="${escapeHtml(selectedBook.title)}" class="book-cover-image">`
                    : '<div class="book-cover-fallback">Chưa có bìa</div>'}
              </div>
              <div class="detail-grid">
                <div class="detail-item"><p class="eyebrow">ISBN</p><strong>${escapeHtml(selectedBook.isbn || "-")}</strong></div>
                <div class="detail-item"><p class="eyebrow">Năm xuất bản</p><strong>${escapeHtml(selectedBook.publishYear || "-")}</strong></div>
                <div class="detail-item"><p class="eyebrow">Nhà xuất bản</p><strong>${escapeHtml(selectedBook.publisherName || "-")}</strong></div>
                <div class="detail-item"><p class="eyebrow">Ngôn ngữ</p><strong>${escapeHtml(selectedBook.languageCode || "-")}</strong></div>
                <div class="detail-item"><p class="eyebrow">Số trang</p><strong>${formatNumber(selectedBook.pageCount || 0)}</strong></div>
                <div class="detail-item"><p class="eyebrow">Tồn kho</p><strong>${formatNumber(selectedBook.stockAvailable)} / ${formatNumber(selectedBook.stockTotal)}</strong></div>
              </div>
            </div>
            <div class="stack detail-stack">
              <div class="chip-card">
                <h4>Tác giả</h4>
                <p class="subtle">${escapeHtml(selectedBook.authorNames || "Chưa có tác giả liên kết")}</p>
              </div>
              <div class="chip-card">
                <h4>Danh mục</h4>
                <p class="subtle">${escapeHtml((selectedBook.categories || []).map((category) => category.name).join(", ") || "Chưa có danh mục liên kết")}</p>
              </div>
              <div class="chip-card">
                <h4>Mô tả</h4>
                <p class="subtle">${escapeHtml(truncate(selectedBook.description || "Chưa có mô tả.", 260))}</p>
              </div>
              <div class="chip-card">
                <h4>Tệp đính kèm</h4>
                <div class="book-asset-grid">
                  ${selectedBookMedia.length
                    ? selectedBookMedia.map(renderMediaAssetCard).join("")
                    : '<div class="empty-state">Chưa có ảnh bìa hoặc file đính kèm.</div>'}
                </div>
              </div>
            </div>
          `
          : '<p class="subtle section-copy">Chọn một sách để xem dữ liệu catalog chi tiết.</p>'}
      </div>
    </div>

    <div id="books-form-section" class="table-card full-width-section">
      <div class="section-head">
        <div>
          <p class="eyebrow">Form sách</p>
          <h3 class="card-title">${pageState.form.id ? "Cập nhật sách và media" : "Tạo sách và upload media"}</h3>
        </div>
      </div>

      <form id="books-form" class="form-grid form-grid-full">
        <input type="hidden" name="id" value="${pageState.form.id}">

        <div class="field">
          <label>ISBN</label>
          <input name="isbn" type="text" value="${escapeHtml(pageState.form.isbn)}" placeholder="978604..." required>
        </div>
        <div class="field">
          <label>Tên sách</label>
          <input name="title" type="text" value="${escapeHtml(pageState.form.title)}" placeholder="Nhập tên sách" required>
        </div>
        <div class="field span-2">
          <label>Phụ đề</label>
          <input name="subtitle" type="text" value="${escapeHtml(pageState.form.subtitle)}" placeholder="Phụ đề nếu có">
        </div>

        ${renderMultiSelectField({
          label: "Tác giả",
          name: "authorIds",
          options: authors,
          selectedIds: selectedAuthorIds,
          placeholder: "Chọn tác giả"
        })}

        ${renderMultiSelectField({
          label: "Danh mục",
          name: "categoryIds",
          options: categories,
          selectedIds: selectedCategoryIds,
          placeholder: "Chọn danh mục"
        })}

        <div class="field">
          <label>Nhà xuất bản</label>
          <select name="publisherId" required>
            <option value="">Chọn nhà xuất bản</option>
            ${publishers
              .map(
                (publisher) => `<option value="${publisher.id}" ${String(pageState.form.publisherId) === String(publisher.id) ? "selected" : ""}>${escapeHtml(publisher.name)}</option>`
              )
              .join("")}
          </select>
        </div>
        <div class="field">
          <label>Năm xuất bản</label>
          <input name="publishYear" type="number" value="${escapeHtml(pageState.form.publishYear)}" min="1900" max="2100">
        </div>
        <div class="field">
          <label>Mã ngôn ngữ</label>
          <input name="languageCode" type="text" value="${escapeHtml(pageState.form.languageCode)}" placeholder="vi">
        </div>
        <div class="field">
          <label>Số trang</label>
          <input name="pageCount" type="number" value="${escapeHtml(pageState.form.pageCount)}" min="1">
        </div>
        <div class="field">
          <label>Tổng tồn</label>
          <input name="stockTotal" type="number" value="${escapeHtml(pageState.form.stockTotal)}" min="0">
        </div>
        <div class="field">
          <label>Tồn khả dụng</label>
          <input name="stockAvailable" type="number" value="${escapeHtml(pageState.form.stockAvailable)}" min="0">
        </div>
        <div class="field span-2">
          <label>Từ khóa</label>
          <input name="keywords" type="text" value="${escapeHtml(pageState.form.keywords)}" placeholder="java, spring, clean code">
        </div>
        <div class="field">
          <label>Trạng thái</label>
          <select name="status">
            ${STATUS_OPTIONS
              .map((status) => `<option value="${status}" ${pageState.form.status === status ? "selected" : ""}>${status}</option>`)
              .join("")}
          </select>
        </div>
        <div class="field span-2">
          <label>Mô tả</label>
          <textarea name="description" placeholder="Tóm tắt ngắn cho catalog">${escapeHtml(pageState.form.description)}</textarea>
        </div>

        <div class="book-form-media span-2">
          <div class="section-head">
            <div>
              <p class="eyebrow">Media trong form sách</p>
              <h4 class="card-title">Tải ảnh bìa và ebook ngay tại đây</h4>
            </div>
          </div>
          <div class="book-media-grid">
            <div class="field upload-dropzone">
              <label>Ảnh bìa</label>
              <input name="coverFile" type="file" accept=".jpg,.jpeg,.png,.webp,image/*">
              <p class="mini">Nếu tải lên, file này sẽ được đánh dấu là ảnh bìa chính.</p>
            </div>
            <div class="field upload-dropzone">
              <label>File bổ sung</label>
              <input name="resourceFiles" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,.epub" multiple>
              <p class="mini">Có thể đính kèm PDF, ebook hoặc ảnh minh họa ngay trong form tạo và sửa sách.</p>
            </div>
          </div>

          ${pageState.form.id
            ? `
              <div class="book-asset-grid">
                ${selectedBookMedia.length
                  ? selectedBookMedia.map(renderMediaAssetCard).join("")
                  : '<div class="empty-state">Lưu sách trước rồi thêm ảnh bìa hoặc file tại đây.</div>'}
              </div>
            `
            : '<div class="empty-state">Tạo sách trước, sau đó các file đã chọn sẽ được tải lên ngay sau khi lưu.</div>'}
        </div>

        <p class="form-message span-2">${escapeHtml(pageState.message || "")}</p>
        <div class="actions span-2">
          <button class="btn primary" type="submit">${pageState.form.id ? "Lưu sách và media" : "Tạo sách và upload media"}</button>
          <button class="btn secondary" type="button" data-action="books-cancel">Xóa nội dung</button>
        </div>
      </form>
    </div>
  `;
}

export function bindBooksPage({ root, store, pageState, setPageState }) {
  const filterForm = root.querySelector("#books-filter-form");
  const bookForm = root.querySelector("#books-form");
  const formSection = root.querySelector("#books-form-section");
  const detailSection = root.querySelector("#books-detail-section");
  const currentPageBooks = store.getBookPage().items;

  if (pageState.scrollTarget) {
    window.requestAnimationFrame(() => {
      if (pageState.scrollTarget === "books-form-section") {
        scrollToElement(formSection);
      } else if (pageState.scrollTarget === "books-detail-section") {
        scrollToElement(detailSection, { extraOffset: 12 });
      } else if (pageState.scrollTarget.startsWith("book-row-")) {
        const row = root.querySelector(`#${pageState.scrollTarget}`);

        if (!scrollToElement(row, { extraOffset: 12 })) {
          scrollToElement(detailSection, { extraOffset: 12 });
        }
      }

      pageState.scrollTarget = "";
    });
  }

  filterForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(filterForm);

    setPageState(
      {
        keyword: String(formData.get("keyword") || ""),
        categoryId: String(formData.get("categoryId") || ""),
        authorId: String(formData.get("authorId") || ""),
        publisherId: String(formData.get("publisherId") || ""),
        available: String(formData.get("available") || ""),
        sortBy: String(formData.get("sortBy") || "createdAt"),
        sortDir: String(formData.get("sortDir") || "desc"),
        size: Number(formData.get("size") || 10),
        page: 0,
        message: ""
      },
      { reload: true }
    );
  });

  bookForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(bookForm);
    const coverFile = root.querySelector('input[name="coverFile"]')?.files?.[0];
    const resourceFiles = Array.from(root.querySelector('input[name="resourceFiles"]')?.files || []);

    try {
      const savedBook = await store.saveBook({
        id: String(formData.get("id") || ""),
        isbn: String(formData.get("isbn") || ""),
        title: String(formData.get("title") || ""),
        subtitle: String(formData.get("subtitle") || ""),
        authorIds: formData.getAll("authorIds").map(String),
        categoryIds: formData.getAll("categoryIds").map(String),
        publisherId: String(formData.get("publisherId") || ""),
        publishYear: String(formData.get("publishYear") || ""),
        languageCode: String(formData.get("languageCode") || ""),
        pageCount: String(formData.get("pageCount") || ""),
        description: String(formData.get("description") || ""),
        keywords: String(formData.get("keywords") || ""),
        stockTotal: String(formData.get("stockTotal") || "0"),
        stockAvailable: String(formData.get("stockAvailable") || "0"),
        status: String(formData.get("status") || "ACTIVE")
      });

      const uploadMessages = [];

      if (coverFile) {
        try {
          await store.uploadMedia({
            bookId: savedBook.id,
            file: coverFile,
            primary: true
          });
          uploadMessages.push("đã tải ảnh bìa");
        } catch (error) {
          setPageState(
            {
              selectedId: savedBook?.id || null,
              message: `Sách đã được lưu nhưng upload ảnh bìa thất bại: ${error.message || "Không thể upload media."}`
            },
            { reload: true }
          );
          return;
        }
      }

      if (resourceFiles.length) {
        try {
          for (const file of resourceFiles) {
            await store.uploadMedia({
              bookId: savedBook.id,
              file,
              primary: false
            });
          }
          uploadMessages.push(`đã tải ${resourceFiles.length} tệp đính kèm`);
        } catch (error) {
          setPageState(
            {
              selectedId: savedBook?.id || null,
              message: `Sách đã được lưu nhưng upload tệp đính kèm thất bại: ${error.message || "Không thể upload media."}`
            },
            { reload: true }
          );
          return;
        }
      }

      const uploadNotice = uploadMessages.length ? ` Đồng thời ${uploadMessages.join(", ")}.` : "";

      setPageState(
        {
          selectedId: savedBook?.id || null,
          form: getDefaultFormValue(),
          message: `${formData.get("id") ? "Cập nhật sách thành công." : "Tạo sách thành công."}${uploadNotice}`,
          scrollTarget: "books-form-section"
        },
        { reload: true }
      );
    } catch (error) {
      setPageState({
        message: error.message || "Không thể lưu sách."
      });
    }
  });

  root.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const action = button.dataset.action;
      const id = Number(button.dataset.id);

      if (action === "books-reset-filters") {
        setPageState(
          {
            keyword: "",
            categoryId: "",
            authorId: "",
            publisherId: "",
            available: "",
            sortBy: "createdAt",
            sortDir: "desc",
            page: 0,
            size: 10,
            selectedId: null,
            message: ""
          },
          { reload: true }
        );
      }

      if (action === "books-new" || action === "books-cancel") {
        setPageState({
          form: getDefaultFormValue(),
          message: "",
          scrollTarget: "books-form-section"
        });
      }

      if (action === "books-select") {
        setPageState({
          selectedId: id,
          message: "",
          scrollTarget: "books-detail-section"
        });
      }

      if (action === "books-edit") {
        try {
          const book = await store.fetchBookById(id);

          setPageState({
            selectedId: id,
            form: mapBookToForm(book),
            message: "",
            scrollTarget: "books-form-section"
          });
        } catch (error) {
          setPageState({
            message: error.message || "Không thể tải chi tiết sách."
          });
        }
      }

      if (action === "books-delete") {
        const shouldDelete = window.confirm(`Xóa sách #${id}?`);

        if (!shouldDelete) {
          return;
        }

        try {
          await store.removeBook(id);
          const nextPage = currentPageBooks.length === 1 && pageState.page > 0
            ? pageState.page - 1
            : pageState.page;
          setPageState(
            {
              selectedId: null,
              form: getDefaultFormValue(),
              page: nextPage,
              scrollTarget: "",
              message: "Xóa sách thành công."
            },
            { reload: true }
          );
        } catch (error) {
          setPageState({
            message: error.message || "Không thể xóa sách."
          });
        }
      }

      if (action === "books-remove-media") {
        const shouldDelete = window.confirm("Xóa file đính kèm này?");

        if (!shouldDelete) {
          return;
        }

        try {
          await store.removeMedia(id);
          setPageState(
            {
              message: "Xóa file đính kèm thành công."
            },
            { reload: true }
          );
        } catch (error) {
          setPageState({
            message: error.message || "Không thể xóa file đính kèm."
          });
        }
      }
    });
  });

  root.querySelector('[data-action="books-prev-page"]')?.addEventListener("click", () => {
    const nextPage = Math.max(0, pageState.page - 1);
    setPageState({ page: nextPage }, { reload: true });
  });

  root.querySelector('[data-action="books-next-page"]')?.addEventListener("click", () => {
    setPageState({ page: pageState.page + 1 }, { reload: true });
  });
}
