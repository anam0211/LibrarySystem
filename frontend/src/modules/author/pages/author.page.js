import { escapeHtml, formatDate, formatNumber, truncate } from "../../../shared/utils/format.js";

export const authorsMeta = {
  title: "Tac gia",
  description: "Quan ly ho so tac gia dang lien ket truc tiep voi du lieu sach."
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
        <p class="eyebrow">Ho so tac gia</p>
        <h2>Quan ly tac gia dang lien ket truc tiep voi du lieu sach</h2>
      </div>
      <div class="actions">
        <button class="btn secondary" type="button" data-action="authors-clear-search">Xoa tim kiem</button>
        <button class="btn primary" type="button" data-action="authors-new">Tao tac gia</button>
      </div>
    </div>

    <div class="grid-3">
      <div class="chip-card"><p class="eyebrow">Tong tac gia</p><h3 class="card-title">${formatNumber(authors.length)}</h3><p class="subtle">So ban ghi dang tra ve tu backend.</p></div>
      <div class="chip-card"><p class="eyebrow">Co tieu su</p><h3 class="card-title">${formatNumber(authors.filter((author) => author.bio).length)}</h3><p class="subtle">San sang cho trang chi tiet va tooltip.</p></div>
      <div class="chip-card"><p class="eyebrow">Lien ket sach</p><h3 class="card-title">${formatNumber(authors.reduce((total, author) => total + author.bookCount, 0))}</h3><p class="subtle">Tong so lien ket giua tac gia va sach.</p></div>
    </div>

    <div class="grid-2 workspace-grid">
      <div class="table-card">
        <div class="section-head">
          <div>
            <p class="eyebrow">Danh sach tac gia</p>
            <h3 class="card-title">Tim va quan ly tac gia</h3>
          </div>
        </div>
        <div class="field">
          <label for="authors-query">Tim theo ten</label>
          <input id="authors-query" type="text" value="${escapeHtml(pageState.query)}" placeholder="Nhap ten tac gia">
        </div>
        <div class="table-wrap table-spacing">
          <table class="table">
            <thead><tr><th>Tac gia</th><th>Sach</th><th>Ngay tao</th><th>Thao tac</th></tr></thead>
            <tbody>
              ${authors.length
                ? authors
                    .map(
                      (author) => `
                        <tr class="${selectedAuthor?.id === author.id ? "row-selected" : ""}">
                          <td><strong>${escapeHtml(author.name)}</strong></td>
                          <td>${formatNumber(author.bookCount)}</td>
                          <td>${formatDate(author.createdAt)}</td>
                          <td>
                            <div class="actions">
                              <button class="action-link" type="button" data-action="authors-select" data-id="${author.id}">Xem</button>
                              <button class="action-link" type="button" data-action="authors-edit" data-id="${author.id}">Sua</button>
                              <button class="action-link danger" type="button" data-action="authors-delete" data-id="${author.id}">Xoa</button>
                            </div>
                          </td>
                        </tr>
                      `
                    )
                    .join("")
                : '<tr><td colspan="4" class="table-empty">Khong co tac gia phu hop.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <div class="table-card">
        <div class="section-head">
          <div>
            <p class="eyebrow">Chi tiet tac gia</p>
            <h3 class="card-title">${selectedAuthor ? escapeHtml(selectedAuthor.name) : "Chua chon tac gia"}</h3>
          </div>
        </div>
        ${selectedAuthor
          ? `
            <div class="detail-grid">
              <div class="detail-item"><p class="eyebrow">So sach</p><strong>${formatNumber(selectedAuthor.bookCount)}</strong></div>
              <div class="detail-item"><p class="eyebrow">Ngay tao</p><strong>${formatDate(selectedAuthor.createdAt)}</strong></div>
            </div>
            <div class="stack detail-stack">
              <div class="chip-card">
                <h4>Tieu su</h4>
                <p class="subtle">${escapeHtml(truncate(selectedAuthor.bio || "Chua co tieu su.", 260))}</p>
              </div>
              <div class="chip-card">
                <h4>Sach lien quan</h4>
                <p class="subtle">${escapeHtml(relatedBooks.map((book) => book.title).join(", ") || "Chua co sach lien ket.")}</p>
              </div>
            </div>
          `
          : '<p class="subtle section-copy">Chon mot tac gia de xem du lieu lien ket trong catalog.</p>'}
      </div>
    </div>

    <div id="authors-form-section" class="table-card full-width-section">
      <div class="section-head">
        <div>
          <p class="eyebrow">Form tac gia</p>
          <h3 class="card-title">${pageState.form.id ? "Cap nhat tac gia" : "Tao tac gia moi"}</h3>
        </div>
      </div>
      <form id="authors-form" class="form-grid form-grid-full">
        <input type="hidden" name="id" value="${pageState.form.id}">
        <div class="field span-2">
          <label>Ten tac gia</label>
          <input name="name" type="text" value="${escapeHtml(pageState.form.name)}" placeholder="Nhap ten tac gia" required>
        </div>
        <div class="field span-2">
          <label>Tieu su</label>
          <textarea name="bio" placeholder="Mo ta ngan cho trang chi tiet va khu tim kiem">${escapeHtml(pageState.form.bio)}</textarea>
        </div>
        <p class="form-message span-2">${escapeHtml(pageState.message || "")}</p>
        <div class="actions span-2">
          <button class="btn primary" type="submit">${pageState.form.id ? "Luu thay doi" : "Tao tac gia"}</button>
          <button class="btn secondary" type="button" data-action="authors-cancel">Xoa noi dung</button>
        </div>
      </form>
    </div>
  `;
}

export function bindAuthorsPage({ root, store, pageState, setPageState }) {
  const searchInput = root.querySelector("#authors-query");
  const form = root.querySelector("#authors-form");
  const formSection = root.querySelector("#authors-form-section");

  if (pageState?.scrollTarget === "authors-form-section" && formSection) {
    window.requestAnimationFrame(() => {
      formSection.scrollIntoView({ behavior: "smooth", block: "start" });
      pageState.scrollTarget = "";
    });
  }

  searchInput?.addEventListener("input", (event) => {
    setPageState({
      query: event.target.value
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
          message: formData.get("id") ? "Cap nhat tac gia thanh cong." : "Tao tac gia thanh cong.",
          scrollTarget: "authors-form-section"
        },
        { reload: true }
      );
    } catch (error) {
      setPageState({
        message: error.message || "Khong the luu tac gia.",
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

      if (action === "authors-select") {
        setPageState({
          selectedId: id,
          message: ""
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
        const shouldDelete = window.confirm(`Xoa tac gia #${id}?`);

        if (!shouldDelete) {
          return;
        }

        try {
          await store.removeAuthor(id);
          setPageState(
            {
              selectedId: null,
              form: getDefaultFormValue(),
              message: "Xoa tac gia thanh cong.",
              scrollTarget: "authors-form-section"
            },
            { reload: true }
          );
        } catch (error) {
          setPageState({
            message: error.message || "Khong the xoa tac gia.",
            scrollTarget: "authors-form-section"
          });
        }
      }
    });
  });
}
