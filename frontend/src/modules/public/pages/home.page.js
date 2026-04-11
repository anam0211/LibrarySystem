import { escapeHtml, formatDate, formatNumber, truncate } from "../../../shared/utils/format.js";

export const homeMeta = {
  title: "Trang chủ",
  description: "Trang công khai của thư viện với bộ lọc, danh mục, tác giả và kho sách phân trang."
};

export function createHomePageState() {
  return {
    keyword: "",
    authorId: "",
    categoryId: "",
    publisherId: "",
    publishYear: "",
    available: "",
    page: 0,
    size: 8,
    message: "",
    searchToolbarOpen: false,
    filterPanelOpen: false,
    scrollTarget: "",
    detailOpen: false,
    selectedBook: null
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

function renderBookActions(bookId) {
  return `
    <div class="catalog-card-actions">
      <button class="btn secondary" type="button" data-page="bookDetail" data-book-id="${bookId}">Xem chi tiết</button>
      <button class="btn secondary public-placeholder-btn" type="button" disabled>Đặt sách</button>
    </div>
  `;
}

function renderHeroBook(book, index) {
  return `
    <article class="hero-book-card hero-book-card-${index + 1}">
      <div class="hero-book-cover">
        ${book.primaryImageUrl
          ? `<img src="${escapeHtml(book.primaryImageUrl)}" alt="${escapeHtml(book.title)}" class="showcase-image">`
          : '<div class="showcase-fallback">Không có bìa</div>'}
      </div>
      <div class="hero-book-body">
        <p class="eyebrow">${escapeHtml(book.primaryCategoryName || "Danh mục")}</p>
        <strong>${escapeHtml(book.title)}</strong>
        <p class="mini">${escapeHtml(book.authorNames || "Chưa có tác giả")}</p>
      </div>
    </article>
  `;
}

function renderCatalogBook(book) {
  return `
    <article class="showcase-card">
      <div class="showcase-cover">
        ${book.primaryImageUrl
          ? `<img src="${escapeHtml(book.primaryImageUrl)}" alt="${escapeHtml(book.title)}" class="showcase-image">`
          : '<div class="showcase-fallback">Không có bìa sách</div>'}
      </div>
      <div class="showcase-body">
        <div class="showcase-badges">
          <span class="pill">${escapeHtml(book.primaryCategoryName || "Danh mục")}</span>
          <span class="pill">${formatNumber(book.stockAvailable)} còn</span>
        </div>
        <h3>${escapeHtml(book.title)}</h3>
        <p class="subtle">${escapeHtml(book.authorNames || "Chưa có tác giả")}</p>
        <p class="mini">${escapeHtml(book.publisherName || "Chưa có NXB")} / ${escapeHtml(book.publishYear || "-")}</p>
        <p class="subtle">${escapeHtml(truncate(book.description || "Chưa có mô tả cho đầu sách này.", 100))}</p>
        ${renderBookActions(book.id)}
      </div>
    </article>
  `;
}

function renderCategorySpotlight(entry) {
  const name = entry.categoryName || entry.name || "Danh mục";
  const count = Number(entry.bookCount || entry.totalBooks || entry.count || 0);

  return `
    <article class="category-spotlight-card">
      <p class="eyebrow">Danh mục</p>
      <h3>${escapeHtml(name)}</h3>
      <p class="subtle">${formatNumber(count)} đầu sách trong kho catalog.</p>
    </article>
  `;
}

function renderAuthorInsight(entry) {
  const name = entry.authorName || entry.name || "Tác giả";
  const count = Number(entry.bookCount || entry.totalBooks || entry.count || 0);

  return `
    <div class="list-item">
      <strong>${escapeHtml(name)}</strong>
      <p class="subtle">${formatNumber(count)} sách đang xuất hiện trong khu vực nổi bật.</p>
    </div>
  `;
}

export function renderHomeNavbarToolbar(store, pageState) {
  const publishers = store.getPublishers();

  return `
    <section class="public-search-toolbar ${pageState.searchToolbarOpen ? "is-open" : ""}">
      <form id="home-navbar-search-form" class="public-search-toolbar-form">
        <div class="public-search-input-wrap">
          <input
            id="home-navbar-keyword"
            name="keyword"
            type="text"
            value="${escapeHtml(pageState.keyword)}"
            placeholder="Tìm tên sách, ISBN, từ khóa..."
          >
          <button class="btn primary public-search-submit" type="submit">Tìm</button>
          <button
            class="public-filter-toggle ${pageState.filterPanelOpen ? "active" : ""}"
            type="button"
            data-action="home-toggle-navbar-filter"
            aria-expanded="${pageState.filterPanelOpen ? "true" : "false"}"
            aria-controls="home-navbar-filter-panel"
          >
            <span class="public-filter-icon" aria-hidden="true"></span>
            <span class="sr-only">Mở bộ lọc</span>
          </button>
        </div>

        <div id="home-navbar-filter-panel" class="public-filter-panel ${pageState.filterPanelOpen ? "is-open" : ""}">
          <div class="field">
            <label for="home-navbar-publisher">Nhà xuất bản</label>
            <select id="home-navbar-publisher" name="publisherId">
              <option value="">Tất cả NXB</option>
              ${publishers
                .map(
                  (publisher) => `<option value="${publisher.id}" ${String(pageState.publisherId) === String(publisher.id) ? "selected" : ""}>${escapeHtml(publisher.name)}</option>`
                )
                .join("")}
            </select>
          </div>
          <div class="field">
            <label for="home-navbar-year">Năm xuất bản</label>
            <input id="home-navbar-year" name="publishYear" type="number" min="1900" max="2100" value="${escapeHtml(pageState.publishYear)}" placeholder="2026">
          </div>
          <div class="field">
            <label for="home-navbar-available">Tình trạng</label>
            <select id="home-navbar-available" name="available">
              <option value="" ${pageState.available === "" ? "selected" : ""}>Tất cả</option>
              <option value="true" ${pageState.available === "true" ? "selected" : ""}>Còn sách</option>
              <option value="false" ${pageState.available === "false" ? "selected" : ""}>Hết sách</option>
            </select>
          </div>
          <div class="field">
            <label for="home-navbar-size">Số lượng</label>
            <select id="home-navbar-size" name="size">
              ${[8, 12, 16]
                .map((size) => `<option value="${size}" ${Number(pageState.size) === size ? "selected" : ""}>${size}</option>`)
                .join("")}
            </select>
          </div>
          <div class="public-filter-actions">
            <button class="btn secondary" type="button" data-action="home-reset-search">Xóa lọc</button>
          </div>
        </div>
      </form>
    </section>
  `;
}

export function renderHomePage(store, pageState) {
  const dashboard = store.getDashboard();
  const featuredBooks = dashboard.featuredBooks.slice(0, 4);
  const newestBooks = dashboard.newestBooks.slice(0, 4);
  const heroBooks = (featuredBooks.length ? featuredBooks : newestBooks).slice(0, 3);
  const categories = store.getCategories();
  const result = store.getSearchResult();
  const activeSearch = hasSearchFilters(pageState);
  const categorySpotlight = (dashboard.booksByCategory?.length ? dashboard.booksByCategory : categories).slice(0, 4);
  const topAuthors = (dashboard.topAuthors || []).slice(0, 3);
  const catalogPage = activeSearch ? result.page : store.getBookPage();
  const catalogTitle = activeSearch ? "Kết quả tìm kiếm" : "Tất cả sách";
  const catalogSubtitle = activeSearch
    ? `${formatNumber(catalogPage.totalItems)} đầu sách phù hợp với bộ lọc hiện tại.`
    : `${formatNumber(catalogPage.totalItems)} đầu sách trong kho sách công khai.`;

  return `
    <section class="storefront-hero">
      <div class="storefront-hero-copy">
        <p class="eyebrow">Thư viện điện tử</p>
        <h1>Tra cứu sách nhanh theo danh mục và từ khóa</h1>
        <p class="subtle">Trang chủ hiển thị toàn bộ sách theo phân trang, có khu nổi bật và đi thẳng tới trang chi tiết sách công khai.</p>
        <div class="actions">
          <button class="btn primary" type="button" data-page="reader">Khu vực người dùng</button>
          <button class="btn secondary" type="button" data-page="login">Đăng nhập admin</button>
        </div>
        <div class="hero-benefit-row">
          <div class="hero-benefit-card">
            <strong>${formatNumber(dashboard.totalBooks)}</strong>
            <p class="mini">Tổng đầu sách</p>
          </div>
          <div class="hero-benefit-card">
            <strong>${formatNumber(dashboard.inStockBooks)}</strong>
            <p class="mini">Đang còn sẵn</p>
          </div>
          <div class="hero-benefit-card">
            <strong>FTS</strong>
            <p class="mini">SQL Server / fallback search</p>
          </div>
        </div>
      </div>

      <div class="storefront-hero-stage">
        <div class="hero-stage-badge">Sách mới và đề xuất đọc</div>
        <div class="hero-stage-grid">
          ${heroBooks.length
            ? heroBooks.map(renderHeroBook).join("")
            : '<div class="empty-state">Đang chờ backend trả dữ liệu sách để hiển thị khu vực nổi bật.</div>'}
        </div>
      </div>
    </section>

    <section id="home-book-discovery" class="table-card storefront-panel">
      <div class="section-head">
        <div>
          <p class="eyebrow">${activeSearch ? "Tìm kiếm" : "Kho sách"}</p>
          <h2>${catalogTitle}</h2>
          <p class="subtle">${catalogSubtitle}</p>
          ${pageState.message ? `<p class="subtle">${escapeHtml(pageState.message)}</p>` : ""}
        </div>
      </div>

      <div class="showcase-grid">
        ${catalogPage.items.length
          ? catalogPage.items.map(renderCatalogBook).join("")
          : '<div class="empty-state">Không tìm thấy sách phù hợp với bộ lọc hiện tại.</div>'}
      </div>

      <div class="catalog-pagination">
        <button class="action-link" type="button" data-action="home-prev-page" ${catalogPage.first ? "disabled" : ""}>Trang trước</button>
        <button class="action-link" type="button" data-action="home-next-page" ${catalogPage.last ? "disabled" : ""}>Trang sau</button>
      </div>
    </section>

    <section class="storefront-dark-band">
      <div class="section-head">
        <div>
          <p class="eyebrow">Thống kê nổi bật</p>
          <h2 class="public-section-title">Chỉ số nhanh từ catalog</h2>
          <p class="public-section-copy">Tóm tắt nhanh quy mô dữ liệu và các nhóm sách đang hiện diện trên hệ thống.</p>
        </div>
      </div>
      <div class="category-spotlight-grid">
        ${categorySpotlight.length
          ? categorySpotlight.map(renderCategorySpotlight).join("")
          : '<div class="empty-state">Chưa có thống kê thể loại từ backend.</div>'}
      </div>
    </section>

    <section class="table-card storefront-panel">
      <div class="section-head">
        <div>
          <p class="eyebrow">Sách nổi bật</p>
          <h2 class="public-section-title">Gợi ý đọc trên trang chủ</h2>
          <p class="public-section-copy">Những đầu sách nên xuất hiện ở khu vực giới thiệu nhanh cho người dùng mới.</p>
        </div>
      </div>
      <div class="showcase-grid">
        ${featuredBooks.length
          ? featuredBooks.map(renderCatalogBook).join("")
          : '<div class="empty-state">Chưa có dữ liệu sách nổi bật.</div>'}
      </div>
    </section>

    <section class="table-card storefront-panel">
      <div class="section-head">
        <div>
          <p class="eyebrow">Sách mới</p>
          <h2 class="public-section-title">Cập nhật gần đây từ catalog</h2>
        </div>
      </div>
      <div class="showcase-grid">
        ${newestBooks.length
          ? newestBooks.map(renderCatalogBook).join("")
          : '<div class="empty-state">Chưa có dữ liệu sách mới.</div>'}
      </div>
    </section>

    <section class="public-footer-note storefront-note-grid">
      <div class="list-item">
        <strong>Thống kê nhanh</strong>
        <p class="subtle">${formatNumber(dashboard.totalAuthors)} tác giả / ${formatNumber(dashboard.totalPublishers)} nhà xuất bản đã được đồng bộ lên giao diện.</p>
      </div>
      <div class="list-item">
        <strong>Tác giả nổi bật</strong>
        <div class="stack compact-stack">
          ${topAuthors.length
            ? topAuthors.map(renderAuthorInsight).join("")
            : '<p class="subtle">Đang chờ backend trả dữ liệu top tác giả.</p>'}
        </div>
      </div>
      <div class="list-item">
        <strong>Lần cập nhật gần nhất</strong>
        <p class="subtle">${dashboard.newestBooks[0]?.createdAt ? formatDate(dashboard.newestBooks[0].createdAt) : "Đang chờ backend trả dữ liệu."}</p>
        <p class="subtle">${escapeHtml(categories.slice(0, 6).map((category) => category.name).join(", ") || "Chưa có dữ liệu thể loại.")}</p>
      </div>
    </section>
  `;
}

export function bindHomePage({ root, shellRoot = document, pageState, setPageState }) {
  const form = shellRoot.querySelector("#home-navbar-search-form");
  const discoverySection = root.querySelector("#home-book-discovery");

  if (pageState.scrollTarget && discoverySection) {
    window.requestAnimationFrame(() => {
      discoverySection.scrollIntoView({ behavior: "smooth", block: "start" });
      pageState.scrollTarget = "";
    });
  }

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);

    setPageState(
      {
        keyword: String(formData.get("keyword") || ""),
        authorId: "",
        categoryId: "",
        publisherId: String(formData.get("publisherId") || ""),
        publishYear: String(formData.get("publishYear") || ""),
        available: String(formData.get("available") || ""),
        size: Number(formData.get("size") || 8),
        page: 0,
        message: "",
        searchToolbarOpen: false,
        filterPanelOpen: false,
        scrollTarget: "home-book-discovery",
        detailOpen: false,
        selectedBook: null
      },
      { reload: true }
    );
  });

  if (typeof shellRoot.__homePageGlobalCleanup === "function") {
    shellRoot.__homePageGlobalCleanup();
  }

  const handleShellClick = (event) => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    if (!pageState.searchToolbarOpen && !pageState.filterPanelOpen) {
      return;
    }

    if (target.closest(".public-topbar")) {
      return;
    }

    setPageState({
      searchToolbarOpen: false,
      filterPanelOpen: false
    });
  };

  const handleShellKeydown = (event) => {
    if (event.key !== "Escape") {
      return;
    }

    if (!pageState.searchToolbarOpen && !pageState.filterPanelOpen) {
      return;
    }

    setPageState({
      searchToolbarOpen: false,
      filterPanelOpen: false
    });
  };

  shellRoot.addEventListener("click", handleShellClick);
  shellRoot.addEventListener("keydown", handleShellKeydown);
  shellRoot.__homePageGlobalCleanup = () => {
    shellRoot.removeEventListener("click", handleShellClick);
    shellRoot.removeEventListener("keydown", handleShellKeydown);
  };

  shellRoot.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;

      if (action === "home-toggle-navbar-filter") {
        setPageState({
          searchToolbarOpen: true,
          filterPanelOpen: !pageState.filterPanelOpen
        });
      }

      if (action === "home-toggle-search-toolbar") {
        const nextOpenState = !pageState.searchToolbarOpen;
        setPageState({
          searchToolbarOpen: nextOpenState,
          filterPanelOpen: nextOpenState ? pageState.filterPanelOpen : false
        });
      }

      if (action === "home-reset-search") {
        setPageState(
          {
            keyword: "",
            authorId: "",
            categoryId: "",
            publisherId: "",
            publishYear: "",
            available: "",
            page: 0,
            size: 8,
            message: "",
            searchToolbarOpen: false,
            filterPanelOpen: false,
            scrollTarget: "",
            detailOpen: false,
            selectedBook: null
          },
          { reload: true }
        );
      }

      if (action === "home-prev-page") {
        setPageState({ page: Math.max(0, pageState.page - 1) }, { reload: true });
      }

      if (action === "home-next-page") {
        setPageState({ page: pageState.page + 1 }, { reload: true });
      }
    });
  });
}
