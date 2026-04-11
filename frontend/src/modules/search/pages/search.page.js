import { escapeHtml, formatDate, formatNumber } from "../../../shared/utils/format.js";

export const searchMeta = {
  title: "Search",
  description: "Advanced book discovery with keyword, author, category, publisher and availability filters."
};

export function createSearchPageState() {
  return {
    keyword: "",
    authorId: "",
    categoryId: "",
    publisherId: "",
    publishYear: "",
    available: "",
    page: 0,
    size: 10,
    message: "Use the filters below to search real backend book data."
  };
}

function hasSearchFilters(pageState) {
  return Boolean(
    pageState.keyword
    || pageState.authorId
    || pageState.categoryId
    || pageState.publisherId
    || pageState.publishYear
    || pageState.available !== ""
  );
}

export function renderSearchPage(store, pageState) {
  const authors = store.getAuthors();
  const categories = store.getCategories();
  const publishers = store.getPublishers();
  const result = store.getSearchResult();
  const books = result.page.items;
  const activeSearch = hasSearchFilters(pageState);

  return `
    <div class="section-head">
      <div>
        <p class="eyebrow">Advanced search</p>
        <h2>Search books with live backend filters and suggestions</h2>
      </div>
      <div class="actions">
        <button class="btn secondary" type="button" data-action="search-reset">Reset search</button>
      </div>
    </div>

    <div class="table-card">
      <form id="search-page-form" class="filter-grid">
        <div class="field">
          <label for="search-keyword">Keyword</label>
          <input id="search-keyword" name="keyword" type="text" value="${escapeHtml(pageState.keyword)}" placeholder="Title, ISBN or keywords">
        </div>
        <div class="field">
          <label for="search-author">Author</label>
          <select id="search-author" name="authorId">
            <option value="">All authors</option>
            ${authors
              .map(
                (author) => `<option value="${author.id}" ${String(pageState.authorId) === String(author.id) ? "selected" : ""}>${escapeHtml(author.name)}</option>`
              )
              .join("")}
          </select>
        </div>
        <div class="field">
          <label for="search-category">Category</label>
          <select id="search-category" name="categoryId">
            <option value="">All categories</option>
            ${categories
              .map(
                (category) => `<option value="${category.id}" ${String(pageState.categoryId) === String(category.id) ? "selected" : ""}>${escapeHtml(category.name)}</option>`
              )
              .join("")}
          </select>
        </div>
        <div class="field">
          <label for="search-publisher">Publisher</label>
          <select id="search-publisher" name="publisherId">
            <option value="">All publishers</option>
            ${publishers
              .map(
                (publisher) => `<option value="${publisher.id}" ${String(pageState.publisherId) === String(publisher.id) ? "selected" : ""}>${escapeHtml(publisher.name)}</option>`
              )
              .join("")}
          </select>
        </div>
        <div class="field">
          <label for="search-year">Publish year</label>
          <input id="search-year" name="publishYear" type="number" value="${escapeHtml(pageState.publishYear)}" min="1900" max="2100">
        </div>
        <div class="field">
          <label for="search-available">Availability</label>
          <select id="search-available" name="available">
            <option value="" ${pageState.available === "" ? "selected" : ""}>All</option>
            <option value="true" ${pageState.available === "true" ? "selected" : ""}>Available</option>
            <option value="false" ${pageState.available === "false" ? "selected" : ""}>Out of stock</option>
          </select>
        </div>
        <div class="field">
          <label for="search-size">Page size</label>
          <select id="search-size" name="size">
            ${[10, 20, 50]
              .map((size) => `<option value="${size}" ${Number(pageState.size) === size ? "selected" : ""}>${size}</option>`)
              .join("")}
          </select>
        </div>
        <div class="field field-submit">
          <label>&nbsp;</label>
          <button class="btn primary" type="submit">Search</button>
        </div>
      </form>

      ${result.suggestions.length
        ? `
          <div class="actions chip-actions">
            ${result.suggestions
              .map(
                (suggestion) => `<button class="action-link" type="button" data-action="search-suggestion" data-value="${escapeHtml(suggestion)}">${escapeHtml(suggestion)}</button>`
              )
              .join("")}
          </div>
        `
        : ""}
    </div>

    ${activeSearch
      ? `
        <div class="grid-3">
          <div class="chip-card"><p class="eyebrow">Results</p><h3 class="card-title">${formatNumber(result.page.totalItems)}</h3><p class="subtle">Books matched by the backend search.</p></div>
          <div class="chip-card"><p class="eyebrow">Suggestions</p><h3 class="card-title">${formatNumber(result.suggestions.length)}</h3><p class="subtle">Autocomplete ideas for the current keyword.</p></div>
          <div class="chip-card"><p class="eyebrow">Current page</p><h3 class="card-title">${formatNumber(result.page.page + 1)} / ${formatNumber(Math.max(result.page.totalPages, 1))}</h3><p class="subtle">Use pagination to inspect more matches.</p></div>
        </div>

        <div class="table-card">
          <div class="section-head">
            <div>
              <p class="eyebrow">Kết quả tìm kiếm</p>
              <h3 class="card-title">${formatNumber(books.length)} sách trên trang này</h3>
            </div>
          </div>
          <div class="table-wrap">
            <table class="table">
              <thead><tr><th>Sách</th><th>Nhà xuất bản</th><th>Năm</th><th>Tồn kho</th><th>Thao tác</th></tr></thead>
              <tbody>
                ${books.length
                  ? books
                      .map(
                        (book) => `
                          <tr>
                            <td>
                              <strong>${escapeHtml(book.title)}</strong>
                              <p class="mini">${escapeHtml(book.authorNames || "Chưa có tác giả")}</p>
                              <p class="mini">${escapeHtml(book.primaryCategoryName)}</p>
                            </td>
                            <td>${escapeHtml(book.publisherName || "-")}</td>
                            <td>${escapeHtml(book.publishYear || "-")}</td>
                            <td>${formatNumber(book.stockAvailable)} / ${formatNumber(book.stockTotal)}</td>
                            <td><button class="action-link" type="button" data-action="search-open-book" data-id="${book.id}">Mở sách</button></td>
                          </tr>
                        `
                      )
                      .join("")
                  : '<tr><td colspan="5" class="table-empty">Không có sách phù hợp với điều kiện tìm kiếm.</td></tr>'}
              </tbody>
            </table>
          </div>
          <div class="catalog-pagination">
            <button class="action-link" type="button" data-action="search-prev-page" ${result.page.first ? "disabled" : ""}>Trang trước</button>
            <button class="action-link" type="button" data-action="search-next-page" ${result.page.last ? "disabled" : ""}>Trang sau</button>
          </div>
        </div>
      `
      : `
        <div class="page-state-card">
          <p class="eyebrow">Search ready</p>
          <h3>Query the live catalog</h3>
          <p class="subtle">${escapeHtml(pageState.message)}</p>
        </div>
      `}
  `;
}

export function bindSearchPage({ root, pageState, setPageState, openRecord }) {
  const form = root.querySelector("#search-page-form");

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);

    setPageState(
      {
        keyword: String(formData.get("keyword") || ""),
        authorId: String(formData.get("authorId") || ""),
        categoryId: String(formData.get("categoryId") || ""),
        publisherId: String(formData.get("publisherId") || ""),
        publishYear: String(formData.get("publishYear") || ""),
        available: String(formData.get("available") || ""),
        size: Number(formData.get("size") || 10),
        page: 0,
        message: ""
      },
      { reload: true }
    );
  });

  root.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;

      if (action === "search-reset") {
        setPageState(
          {
            keyword: "",
            authorId: "",
            categoryId: "",
            publisherId: "",
            publishYear: "",
            available: "",
            page: 0,
            size: 10,
            message: "Use the filters below to search real backend book data."
          },
          { reload: true }
        );
      }

      if (action === "search-suggestion") {
        setPageState(
          {
            keyword: button.dataset.value || "",
            page: 0,
            message: ""
          },
          { reload: true }
        );
      }

      if (action === "search-open-book") {
        openRecord("books", Number(button.dataset.id));
      }

      if (action === "search-prev-page") {
        setPageState({ page: Math.max(0, pageState.page - 1) }, { reload: true });
      }

      if (action === "search-next-page") {
        setPageState({ page: pageState.page + 1 }, { reload: true });
      }
    });
  });
}
