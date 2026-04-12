import { escapeHtml, formatNumber, truncate } from "../../../shared/utils/format.js";
import { scrollToElement } from "../../../shared/utils/scroll.js";

export const homeMeta = {
  title: "Trang chủ",
  description: "Tra cứu sách công khai."
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
        <p class="eyebrow">${escapeHtml(book.primaryCategoryName || "Thể loại")}</p>
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
          <span class="pill">${escapeHtml(book.primaryCategoryName || "Thể loại")}</span>
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

function renderShortcutCard({ eyebrow, title, value, unit, action, actionLabel }) {
  return `
    <article class="shortcut-card">
      <p class="eyebrow">${escapeHtml(eyebrow)}</p>
      <strong>${escapeHtml(title)}</strong>
      <p class="shortcut-value">${formatNumber(value)}</p>
      <p class="mini">${escapeHtml(unit)}</p>
      <button class="action-link" type="button" data-action="${escapeHtml(action)}">${escapeHtml(actionLabel)}</button>
    </article>
  `;
}

function findNamedItem(items, id) {
  return items.find((item) => String(item.id) === String(id)) || null;
}

function createHomeResetState(overrides = {}) {
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
    selectedBook: null,
    ...overrides
  };
}

function renderTrailSeparator() {
  return `<span class="public-filter-trail-separator" aria-hidden="true">/</span>`;
}

function renderHomeFilterTrail(store, pageState) {
  const category = pageState.categoryId ? findNamedItem(store.getCategories(), pageState.categoryId) : null;
  const author = pageState.authorId ? findNamedItem(store.getAuthors(), pageState.authorId) : null;

  if (!category && !author) {
    return "";
  }

  const segments = [
    `
      <button class="public-filter-trail-link is-root" type="button" data-page="home">
        <span>Trang chu</span>
      </button>
    `
  ];

  if (category) {
    segments.push(renderTrailSeparator());
    segments.push('<span class="public-filter-trail-label">Danh muc</span>');
    segments.push(renderTrailSeparator());
    segments.push(`
      <button
        class="public-filter-trail-link"
        type="button"
        data-action="home-crumb-category"
        data-category-id="${category.id}"
      >
        ${escapeHtml(category.name)}
      </button>
    `);
  }

  if (author) {
    segments.push(renderTrailSeparator());
    segments.push('<span class="public-filter-trail-label">Tac gia</span>');
    segments.push(renderTrailSeparator());
    segments.push(`
      <button
        class="public-filter-trail-link ${category ? "is-current" : ""}"
        type="button"
        data-action="home-crumb-author"
        data-author-id="${author.id}"
        data-category-id="${category?.id || ""}"
      >
        ${escapeHtml(author.name)}
      </button>
    `);
  }

  return `
    <nav class="public-filter-trail" aria-label="Điều hướng bộ lọc">
      ${segments.join("")}
    </nav>
  `;
}

function getAvailabilityLabel(value) {
  if (value === "true") {
    return "Còn sách";
  }

  if (value === "false") {
    return "Hết sách";
  }

  return "";
}

function getAppliedHomeFilters(store, pageState) {
  const filters = [];
  const category = pageState.categoryId ? findNamedItem(store.getCategories(), pageState.categoryId) : null;
  const author = pageState.authorId ? findNamedItem(store.getAuthors(), pageState.authorId) : null;
  const publisher = pageState.publisherId ? findNamedItem(store.getPublishers(), pageState.publisherId) : null;
  const availabilityLabel = getAvailabilityLabel(pageState.available);

  if (pageState.keyword) {
    filters.push({
      key: "keyword",
      label: "Từ khóa",
      value: pageState.keyword
    });
  }

  if (category) {
    filters.push({
      key: "categoryId",
      label: "Danh mục",
      value: category.name
    });
  }

  if (author) {
    filters.push({
      key: "authorId",
      label: "Tác giả",
      value: author.name
    });
  }

  if (publisher) {
    filters.push({
      key: "publisherId",
      label: "Nhà xuất bản",
      value: publisher.name
    });
  }

  if (pageState.publishYear) {
    filters.push({
      key: "publishYear",
      label: "Năm xuất bản",
      value: pageState.publishYear
    });
  }

  if (availabilityLabel) {
    filters.push({
      key: "available",
      label: "Tình trạng",
      value: availabilityLabel
    });
  }

  return filters;
}

function renderHomeAppliedFilters(store, pageState) {
  const filters = getAppliedHomeFilters(store, pageState);

  if (!filters.length) {
    return "";
  }

  return `
    <section class="public-active-filter-panel" aria-label="Bộ lọc áp dụng">
      <div class="public-active-filter-head">
        <h3 class="public-active-filter-title">Đang lọc theo</h3>
        <button class="public-active-filter-clear" type="button" data-action="home-reset-search">Bỏ chọn tất cả</button>
      </div>
      <div class="public-active-filter-list">
        ${filters
          .map(
            (filter) => `
              <button
                class="public-active-filter-chip"
                type="button"
                data-action="home-remove-filter"
                data-filter-key="${escapeHtml(filter.key)}"
              >
                <span class="public-active-filter-chip-label">${escapeHtml(filter.label)}:</span>
                <span>${escapeHtml(filter.value)}</span>
                <span class="public-active-filter-chip-remove" aria-hidden="true">&times;</span>
              </button>
            `
          )
          .join("")}
      </div>
    </section>
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
            placeholder="Tìm tên sách, ISBN hoặc từ khóa..."
          >
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
          <button class="btn primary public-search-submit" type="submit">Tìm</button>
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
  const result = store.getSearchResult();
  const activeSearch = hasSearchFilters(pageState);
  const catalogPage = activeSearch ? result.page : store.getBookPage();
  const catalogTitle = activeSearch ? "Kết quả tìm kiếm" : "Kho sách";
  const catalogSubtitle = activeSearch
    ? `${formatNumber(catalogPage.totalItems)} đầu sách phù hợp.`
    : `${formatNumber(catalogPage.totalItems)} đầu sách đang hiển thị.`;

  return `
    <section class="storefront-hero">
      <div class="storefront-hero-copy">
        <p class="eyebrow">Thư viện điện tử</p>
        <h1>Tìm sách trong thư viện</h1>
        <p class="subtle">Tra cứu theo tên sách, tác giả, thể loại hoặc nhà xuất bản.</p>
        <div class="actions">
          <button class="btn primary" type="button" data-action="home-scroll-books">Xem kho sách</button>
          <button class="btn secondary" type="button" data-action="home-scroll-featured">Sách nổi bật</button>
        </div>
        <div class="hero-benefit-row">
          <div class="hero-benefit-card">
            <strong>${formatNumber(dashboard.totalBooks)}</strong>
            <p class="mini">Đầu sách</p>
          </div>
          <div class="hero-benefit-card">
            <strong>${formatNumber(dashboard.inStockBooks)}</strong>
            <p class="mini">Còn sẵn</p>
          </div>
          <div class="hero-benefit-card">
            <strong>${formatNumber(dashboard.totalCategories)}</strong>
            <p class="mini">Danh mục</p>
          </div>
        </div>
      </div>

      <div class="storefront-hero-stage">
        <div class="hero-stage-badge">Gợi ý đọc nhanh</div>
        <div class="hero-stage-grid">
          ${heroBooks.length
            ? heroBooks.map(renderHeroBook).join("")
            : '<div class="empty-state">Chưa có dữ liệu sách.</div>'}
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

      ${renderHomeFilterTrail(store, pageState)}
      ${renderHomeAppliedFilters(store, pageState)}

      <div class="showcase-grid">
        ${catalogPage.items.length
          ? catalogPage.items.map(renderCatalogBook).join("")
          : '<div class="empty-state">Không tìm thấy sách phù hợp.</div>'}
      </div>

      <div class="catalog-pagination">
        <button class="action-link" type="button" data-action="home-prev-page" ${catalogPage.first ? "disabled" : ""}>Trang trước</button>
        <button class="action-link" type="button" data-action="home-next-page" ${catalogPage.last ? "disabled" : ""}>Trang sau</button>
      </div>
    </section>

    <section class="table-card storefront-panel storefront-shortcuts">
      <div class="section-head">
        <div>
          <p class="eyebrow">Lối vào nhanh</p>
          <h2 class="public-section-title">Khám phá nhanh</h2>
        </div>
      </div>
      <div class="shortcut-grid">
        ${renderShortcutCard({
          eyebrow: "Kho sách",
          title: "Tất cả đầu sách",
          value: dashboard.totalBooks,
          unit: "đầu sách",
          action: "home-scroll-books",
          actionLabel: "Mở kho sách"
        })}
        ${renderShortcutCard({
          eyebrow: "Nổi bật",
          title: "Sách nổi bật",
          value: featuredBooks.length,
          unit: "mục hiển thị",
          action: "home-scroll-featured",
          actionLabel: "Xem mục này"
        })}
        ${renderShortcutCard({
          eyebrow: "Cập nhật",
          title: "Sách mới",
          value: newestBooks.length,
          unit: "mục mới",
          action: "home-scroll-newest",
          actionLabel: "Xem cập nhật"
        })}
        ${renderShortcutCard({
          eyebrow: "Bộ lọc",
          title: "Danh mục",
          value: dashboard.totalCategories,
          unit: "danh mục",
          action: "home-toggle-search-toolbar",
          actionLabel: "Mở bộ lọc"
        })}
      </div>
    </section>

    <section id="home-featured-books" class="table-card storefront-panel">
      <div class="section-head">
        <div>
          <p class="eyebrow">Nổi bật</p>
          <h2 class="public-section-title">Sách nổi bật</h2>
        </div>
      </div>
      <div class="showcase-grid">
        ${featuredBooks.length
          ? featuredBooks.map(renderCatalogBook).join("")
          : '<div class="empty-state">Chưa có dữ liệu sách nổi bật.</div>'}
      </div>
    </section>

    <section id="home-newest-books" class="table-card storefront-panel">
      <div class="section-head">
        <div>
          <p class="eyebrow">Mới cập nhật</p>
          <h2 class="public-section-title">Sách mới</h2>
        </div>
      </div>
      <div class="showcase-grid">
        ${newestBooks.length
          ? newestBooks.map(renderCatalogBook).join("")
          : '<div class="empty-state">Chưa có dữ liệu sách mới.</div>'}
      </div>
    </section>
  `;
}

export function bindHomePage({ root, shellRoot = document, pageState, setPageState }) {
  const form = shellRoot.querySelector("#home-navbar-search-form");
  const discoverySection = root.querySelector("#home-book-discovery");
  const featuredSection = root.querySelector("#home-featured-books");
  const newestSection = root.querySelector("#home-newest-books");

  if (pageState.scrollTarget) {
    window.requestAnimationFrame(() => {
      scrollToElement(root.querySelector(`#${pageState.scrollTarget}`));
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
          createHomeResetState(),
          { reload: true }
        );
      }

      if (action === "home-crumb-category") {
        setPageState(
          createHomeResetState({
            categoryId: String(button.dataset.categoryId || ""),
            size: Number(pageState.size) || 8,
            scrollTarget: "home-book-discovery"
          }),
          { reload: true }
        );
      }

      if (action === "home-crumb-author") {
        setPageState(
          createHomeResetState({
            categoryId: String(button.dataset.categoryId || ""),
            authorId: String(button.dataset.authorId || ""),
            size: Number(pageState.size) || 8,
            scrollTarget: "home-book-discovery"
          }),
          { reload: true }
        );
      }

      if (action === "home-remove-filter") {
        const filterKey = String(button.dataset.filterKey || "");
        const nextState = createHomeResetState({
          keyword: pageState.keyword,
          authorId: pageState.authorId,
          categoryId: pageState.categoryId,
          publisherId: pageState.publisherId,
          publishYear: pageState.publishYear,
          available: pageState.available,
          size: Number(pageState.size) || 8,
          scrollTarget: "home-book-discovery"
        });

        if (filterKey) {
          nextState[filterKey] = "";
        }

        setPageState(nextState, { reload: true });
      }

      if (action === "home-scroll-books") {
        scrollToElement(discoverySection);
      }

      if (action === "home-scroll-featured") {
        scrollToElement(featuredSection);
      }

      if (action === "home-scroll-newest") {
        scrollToElement(newestSection);
      }

      if (action === "home-prev-page") {
        setPageState({ page: Math.max(0, pageState.page - 1), scrollTarget: "home-book-discovery" }, { reload: true });
      }

      if (action === "home-next-page") {
        setPageState({ page: pageState.page + 1, scrollTarget: "home-book-discovery" }, { reload: true });
      }
    });
  });
}
