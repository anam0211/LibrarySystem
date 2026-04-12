import { escapeHtml, formatDate, formatNumber, truncate } from "../../../shared/utils/format.js";
import { scrollToElement } from "../../../shared/utils/scroll.js";

export const authorsMeta = {
  title: "Tác giả",
  description: "Quản lý hồ sơ tác giả và liên kết sách trong catalog."
};

function getDefaultFormValue() {
  return {
    id: "",
    name: "",
    bio: ""
  };
}

export function createAuthorsPageState() {
  return {
    selectedId: null,
    form: getDefaultFormValue(),
    query: "",
    message: "",
    scrollTarget: ""
  };
}

export function renderAuthorsPage(store, pageState) {
  const authors = store
    .getAuthors()
    .filter((author) => !pageState.query || author.name.toLowerCase().includes(pageState.query.toLowerCase()));
  const selectedAuthor = authors.find((author) => author.id === pageState.selectedId) || authors[0] || null;
  const relatedBooks = selectedAuthor
    ? store.getBookOptions().filter((book) => (book.authors || []).some((author) => author.id === selectedAuthor.id)).slice(0, 5)
    : [];

  return `
    <div class="section-head">
      <div>
        <p class="eyebrow">Tác giả</p>
        <h2>Quản lý tác giả theo khu làm việc riêng</h2>
      </div>
      <div class="actions">
        <button class="btn secondary" type="button" data-action="authors-clear-search">Xóa tìm kiếm</button>
        <button class="btn primary" type="button" data-action="authors-new">Tạo tác giả</button>
      </div>
    </div>

    <div class="grid-3">
      <div class="chip-card"><p class="eyebrow">Tổng tác giả</p><h3 class="card-title">${formatNumber(authors.length)}</h3><p class="subtle">Số bản ghi hiện có.</p></div>
      <div class="chip-card"><p class="eyebrow">Có tiểu sử</p><h3 class="card-title">${formatNumber(authors.filter((author) => author.bio).length)}</h3><p class="subtle">Đã có phần mô tả.</p></div>
      <div class="chip-card"><p class="eyebrow">Liên kết sách</p><h3 class="card-title">${formatNumber(authors.reduce((total, author) => total + author.bookCount, 0))}</h3><p class="subtle">Tổng đầu sách đã gắn tác giả.</p></div>
    </div>

    <div class="entity-admin-stack">
      <details class="table-card accordion-card" open>
        <summary class="accordion-summary">
          <div>
            <p class="eyebrow">Danh sách tác giả</p>
            <h3 class="card-title">Chọn một dòng để xem chi tiết</h3>
          </div>
          <span class="accordion-icon" aria-hidden="true"></span>
        </summary>
        <div class="accordion-content">
        <div class="field">
          <label for="authors-query">Tìm theo tên</label>
          <input id="authors-query" type="text" value="${escapeHtml(pageState.query)}" placeholder="Nhập tên tác giả">
        </div>
        <div class="table-wrap table-spacing">
          <table class="table">
            <thead>
              <tr>
                <th>Tác giả</th>
                <th>Sách</th>
                <th>Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              ${authors.length
                ? authors
                    .map(
                      (author) => `
                        <tr
                          class="record-row ${selectedAuthor?.id === author.id ? "row-selected" : ""}"
                          data-action="authors-select"
                          data-id="${author.id}"
                          tabindex="0"
                        >
                          <td><strong>${escapeHtml(author.name)}</strong></td>
                          <td>${formatNumber(author.bookCount)}</td>
                          <td>${formatDate(author.createdAt)}</td>
                        </tr>
                      `
                    )
                    .join("")
                : '<tr><td colspan="3" class="table-empty">Không có tác giả phù hợp.</td></tr>'}
            </tbody>
          </table>
        </div>
        </div>
      </details>

      <div id="authors-detail-section" class="table-card">
        <div class="section-head">
          <div>
            <p class="eyebrow">Chi tiết tác giả</p>
            <h3 class="card-title">${selectedAuthor ? escapeHtml(selectedAuthor.name) : "Chưa chọn tác giả"}</h3>
          </div>
          <div class="actions">
            <button class="btn secondary" type="button" data-action="authors-edit" data-id="${selectedAuthor?.id || ""}" ${selectedAuthor ? "" : "disabled"}>Sửa</button>
            <button class="action-link danger" type="button" data-action="authors-delete" data-id="${selectedAuthor?.id || ""}" ${selectedAuthor ? "" : "disabled"}>Xóa</button>
          </div>
        </div>
        ${selectedAuthor
          ? `
            <div class="detail-grid">
              <div class="detail-item"><p class="eyebrow">Số sách</p><strong>${formatNumber(selectedAuthor.bookCount)}</strong></div>
              <div class="detail-item"><p class="eyebrow">Ngày tạo</p><strong>${formatDate(selectedAuthor.createdAt)}</strong></div>
            </div>
            <div class="stack detail-stack">
              <div class="chip-card">
                <h4>Tiểu sử</h4>
                <p class="subtle">${escapeHtml(truncate(selectedAuthor.bio || "Chưa có tiểu sử.", 260))}</p>
              </div>
              <div class="chip-card">
                <h4>Sách liên quan</h4>
                <p class="subtle">${escapeHtml(relatedBooks.map((book) => book.title).join(", ") || "Chưa có sách liên kết.")}</p>
              </div>
            </div>
          `
          : '<p class="subtle section-copy">Chọn một tác giả để xem chi tiết và thao tác.</p>'}
      </div>
    </div>

    <div id="authors-form-section" class="table-card full-width-section">
      <div class="section-head">
        <div>
          <p class="eyebrow">Form tác giả</p>
          <h3 class="card-title">${pageState.form.id ? "Cập nhật tác giả" : "Tạo tác giả mới"}</h3>
        </div>
      </div>
      <form id="authors-form" class="form-grid form-grid-full">
        <input type="hidden" name="id" value="${pageState.form.id}">
        <div class="field span-2">
          <label>Tên tác giả</label>
          <input name="name" type="text" value="${escapeHtml(pageState.form.name)}" placeholder="Nhập tên tác giả" required>
        </div>
        <div class="field span-2">
          <label>Tiểu sử</label>
          <textarea name="bio" placeholder="Mô tả ngắn về tác giả">${escapeHtml(pageState.form.bio)}</textarea>
        </div>
        <p class="form-message span-2">${escapeHtml(pageState.message || "")}</p>
        <div class="actions span-2">
          <button class="btn primary" type="submit">${pageState.form.id ? "Lưu thay đổi" : "Tạo tác giả"}</button>
          <button class="btn secondary" type="button" data-action="authors-cancel">Xóa nội dung</button>
        </div>
      </form>
    </div>
  `;
}

export function bindAuthorsPage({ root, store, pageState, setPageState }) {
  const searchInput = root.querySelector("#authors-query");
  const form = root.querySelector("#authors-form");
  const formSection = root.querySelector("#authors-form-section");
  const detailSection = root.querySelector("#authors-detail-section");

  if (pageState.scrollTarget) {
    window.requestAnimationFrame(() => {
      if (pageState.scrollTarget === "authors-form-section") {
        scrollToElement(formSection);
      }

      if (pageState.scrollTarget === "authors-detail-section") {
        scrollToElement(detailSection, { extraOffset: 12 });
      }

      pageState.scrollTarget = "";
    });
  }

  searchInput?.addEventListener("input", (event) => {
    setPageState({
      query: event.target.value
    });
  });

  root.querySelectorAll('[data-action="authors-select"]').forEach((row) => {
    row.addEventListener("click", () => {
      setPageState({
        selectedId: Number(row.dataset.id),
        message: "",
        scrollTarget: "authors-detail-section"
      });
    });

    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        row.click();
      }
    });
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);

    try {
      const savedAuthor = await store.saveAuthor({
        id: String(formData.get("id") || ""),
        name: String(formData.get("name") || ""),
        bio: String(formData.get("bio") || "")
      });

      setPageState(
        {
          selectedId: savedAuthor?.id || null,
          form: getDefaultFormValue(),
          message: formData.get("id") ? "Cập nhật tác giả thành công." : "Tạo tác giả thành công.",
          scrollTarget: "authors-form-section"
        },
        { reload: true }
      );
    } catch (error) {
      setPageState({
        message: error.message || "Không thể lưu tác giả.",
        scrollTarget: "authors-form-section"
      });
    }
  });

  root.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const action = button.dataset.action;
      const id = Number(button.dataset.id);

      if (action === "authors-clear-search") {
        setPageState({ query: "" });
      }

      if (action === "authors-new" || action === "authors-cancel") {
        setPageState({
          form: getDefaultFormValue(),
          message: "",
          scrollTarget: "authors-form-section"
        });
      }

      if (action === "authors-edit") {
        const author = store.getAuthorById(id);

        if (!author) {
          return;
        }

        setPageState({
          selectedId: id,
          form: {
            id: String(author.id),
            name: author.name,
            bio: author.bio || ""
          },
          message: "",
          scrollTarget: "authors-form-section"
        });
      }

      if (action === "authors-delete") {
        const shouldDelete = window.confirm(`Xóa tác giả #${id}?`);

        if (!shouldDelete) {
          return;
        }

        try {
          await store.removeAuthor(id);
          setPageState(
            {
              selectedId: null,
              form: getDefaultFormValue(),
              message: "Xóa tác giả thành công.",
              scrollTarget: "authors-detail-section"
            },
            { reload: true }
          );
        } catch (error) {
          setPageState({
            message: error.message || "Không thể xóa tác giả.",
            scrollTarget: "authors-detail-section"
          });
        }
      }
    });
  });
}
