import { escapeHtml, formatDate, formatNumber } from "../../../shared/utils/format.js";

export const dashboardMeta = {
  title: "Dashboard",
  description: "Bảng điều khiển tổng hợp số liệu catalog lấy trực tiếp từ backend."
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
          : '<div class="empty-state">Chưa có dữ liệu hiển thị.</div>'}
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
                    <p class="mini">${escapeHtml(book.primaryCategoryName)} / ${escapeHtml(book.publisherName || "Chưa có NXB")} / ${formatDate(book.createdAt)}</p>
                  </div>
                `
              )
              .join("")
          : '<div class="empty-state">Chưa có đầu sách phù hợp.</div>'}
      </div>
    </div>
  `;
}

export function renderDashboardPage(store) {
  const dashboard = store.getDashboard();

  return `
    <div class="stats-grid">
      <div class="stat-card">
        <p class="eyebrow">Sách</p>
        <div class="stat-value">${formatNumber(dashboard.totalBooks)}</div>
        <p class="mini">${formatNumber(dashboard.inStockBooks)} còn trong kho</p>
      </div>
      <div class="stat-card">
        <p class="eyebrow">Tác giả</p>
        <div class="stat-value">${formatNumber(dashboard.totalAuthors)}</div>
        <p class="mini">Đã liên kết với catalog thật</p>
      </div>
      <div class="stat-card">
        <p class="eyebrow">Thể loại</p>
        <div class="stat-value">${formatNumber(dashboard.totalCategories)}</div>
        <p class="mini">Có đủ nhóm cha và nhóm con</p>
      </div>
      <div class="stat-card">
        <p class="eyebrow">Nhà xuất bản</p>
        <div class="stat-value">${formatNumber(dashboard.totalPublishers)}</div>
        <p class="mini">${formatNumber(dashboard.outOfStockBooks)} đầu sách đang hết</p>
      </div>
    </div>

    <div class="grid-2">
      ${renderMetricList("Sách theo thể loại", dashboard.booksByCategory)}
      ${renderMetricList("Tác giả nổi bật", dashboard.topAuthors)}
    </div>

    <div class="grid-2">
      ${renderMetricList("Thể loại nổi bật", dashboard.topCategories)}
      <div class="table-card">
        <div class="section-head">
          <div>
            <p class="eyebrow">Mức độ hoàn thiện</p>
            <h3 class="card-title admin-heading">Phạm vi backend hiện tại</h3>
          </div>
        </div>
        <div class="stack">
          <div class="list-item">
            <strong>Đã nối backend</strong>
            <p class="subtle admin-copy">Sách, tác giả, thể loại, nhà xuất bản, tìm kiếm, media và dashboard catalog đang chạy bằng API thật.</p>
          </div>
          <div class="list-item">
            <strong>Sẵn sàng cho bước tiếp theo</strong>
            <p class="subtle admin-copy">Auth, users, circulation, notifications và operations report đã có sẵn khung frontend để nối backend.</p>
          </div>
          <div class="list-item">
            <strong>Dễ demo</strong>
            <p class="subtle admin-copy">Dashboard này lấy số liệu thật, danh sách thật và cho phép đi thẳng tới các màn chi tiết.</p>
          </div>
        </div>
      </div>
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
