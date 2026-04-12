import { escapeHtml, formatDate, formatNumber } from "../../../shared/utils/format.js";

export const dashboardMeta = {
  title: "Dashboard",
  description: "Tổng quan catalog và tồn kho."
};

function renderMetricList(title, items, labelKey = "label") {
  return `
    <div class="table-card">
      <div class="section-head">
        <div>
          <p class="eyebrow">${escapeHtml(title)}</p>
          <h3 class="card-title admin-heading">${formatNumber(items.length)} mục</h3>
        </div>
      </div>
      <div class="stack">
        ${items.length
          ? items
              .map(
                (item) => `
                  <div class="list-item">
                    <div class="list-item-head">
                      <strong>${escapeHtml(item[labelKey] || item.name || "-")}</strong>
                      <span class="pill">${formatNumber(item.value || 0)}</span>
                    </div>
                  </div>
                `
              )
              .join("")
          : '<div class="empty-state">Chưa có dữ liệu.</div>'}
      </div>
    </div>
  `;
}

function renderBookList(title, books, action) {
  return `
    <div class="table-card">
      <div class="section-head">
        <div>
          <p class="eyebrow">${escapeHtml(title)}</p>
          <h3 class="card-title admin-heading">${formatNumber(books.length)} sách</h3>
        </div>
      </div>
      <div class="stack">
        ${books.length
          ? books
              .map(
                (book) => `
                  <div class="list-item">
                    <div class="list-item-head">
                      <strong>${escapeHtml(book.title)}</strong>
                      <button class="action-link" type="button" data-action="${action}" data-id="${book.id}">Mở</button>
                    </div>
                    <p class="subtle">${escapeHtml(book.authorNames || "Chưa có tác giả")}</p>
                    <p class="mini">
                      ${escapeHtml(book.primaryCategoryName || "Chưa có thể loại")}
                      / ${escapeHtml(book.publisherName || "Chưa có NXB")}
                      / ${escapeHtml(formatDate(book.createdAt))}
                    </p>
                  </div>
                `
              )
              .join("")
          : '<div class="empty-state">Chưa có đầu sách.</div>'}
      </div>
    </div>
  `;
}

function renderInventorySummary(dashboard) {
  return `
    <div class="table-card">
      <div class="section-head">
        <div>
          <p class="eyebrow">Tình trạng kho</p>
          <h3 class="card-title admin-heading">Tồn kho</h3>
        </div>
      </div>
      <div class="stack">
        <div class="list-item">
          <div class="list-item-head">
            <strong>Sách còn trong kho</strong>
            <span class="pill">${formatNumber(dashboard.inStockBooks)}</span>
          </div>
          <p class="subtle">Có thể mượn.</p>
        </div>
        <div class="list-item">
          <div class="list-item-head">
            <strong>Sách đang hết</strong>
            <span class="pill">${formatNumber(dashboard.outOfStockBooks)}</span>
          </div>
          <p class="subtle">Cần bổ sung.</p>
        </div>
        <div class="list-item">
          <div class="list-item-head">
            <strong>Thực thể catalog</strong>
            <span class="pill">
              ${formatNumber(dashboard.totalAuthors + dashboard.totalCategories + dashboard.totalPublishers)}
            </span>
          </div>
          <p class="subtle">Tổng số dữ liệu liên quan.</p>
        </div>
      </div>
    </div>
  `;
}

export function renderDashboardPage(store) {
  const dashboard = store.getDashboard();

  return `
    <section class="table-card">
      <div class="section-head">
        <div>
          <p class="eyebrow">Catalog</p>
          <h2 class="card-title">Dashboard</h2>
        </div>
        <div class="actions">
          <button class="btn secondary" type="button" data-page="books">Sách</button>
          <button class="btn secondary" type="button" data-page="authors">Tác giả</button>
          <button class="btn secondary" type="button" data-page="categories">Danh mục</button>
          <button class="btn primary" type="button" data-page="search">Tìm kiếm</button>
        </div>
      </div>
    </section>

    <div class="stats-grid">
      <div class="stat-card">
        <p class="eyebrow">Sách</p>
        <div class="stat-value">${formatNumber(dashboard.totalBooks)}</div>
        <p class="mini">${formatNumber(dashboard.inStockBooks)} còn sẵn</p>
      </div>
      <div class="stat-card">
        <p class="eyebrow">Tác giả</p>
        <div class="stat-value">${formatNumber(dashboard.totalAuthors)}</div>
        <p class="mini">Tổng số tác giả</p>
      </div>
      <div class="stat-card">
        <p class="eyebrow">Danh mục</p>
        <div class="stat-value">${formatNumber(dashboard.totalCategories)}</div>
        <p class="mini">Tổng số danh mục</p>
      </div>
      <div class="stat-card">
        <p class="eyebrow">Nhà xuất bản</p>
        <div class="stat-value">${formatNumber(dashboard.totalPublishers)}</div>
        <p class="mini">Tổng số NXB</p>
      </div>
    </div>

    <div class="grid-2">
      ${renderMetricList("Sách theo thể loại", dashboard.booksByCategory)}
      ${renderMetricList("Tác giả nổi bật", dashboard.topAuthors)}
    </div>

    <div class="grid-2">
      ${renderMetricList("Thể loại nổi bật", dashboard.topCategories)}
      ${renderInventorySummary(dashboard)}
    </div>

    <div class="grid-2">
      ${renderBookList("Sách mới", dashboard.newestBooks, "dashboard-open-book")}
      ${renderBookList("Sách nổi bật", dashboard.featuredBooks, "dashboard-open-book")}
    </div>
  `;
}

export function bindDashboardPage({ root, openRecord }) {
  root.querySelectorAll('[data-action="dashboard-open-book"]').forEach((button) => {
    button.addEventListener("click", () => {
      openRecord("books", Number(button.dataset.id));
    });
  });
}
