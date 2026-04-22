import { escapeHtml, formatNumber, truncate } from "../../../shared/utils/format.js";

export const readerMeta = {
  title: "Tài khoản người dùng",
  description: "Thông tin tài khoản và gợi ý sách."
};

function renderReaderRecommendation(book) {
  return `
    <article class="showcase-card compact-showcase-card">
      <div class="showcase-cover compact-showcase-cover">
        ${book.primaryImageUrl
          ? `<img src="${escapeHtml(book.primaryImageUrl)}" alt="${escapeHtml(book.title)}" class="showcase-image">`
          : '<div class="showcase-fallback">Không có bìa</div>'}
      </div>
      <div class="showcase-body">
        <p class="eyebrow">${escapeHtml(book.primaryCategoryName || "Thể loại")}</p>
        <h3>${escapeHtml(book.title)}</h3>
        <p class="subtle">${escapeHtml(book.authorNames || "Chưa có tác giả")}</p>
        <p class="mini">${escapeHtml(truncate(book.description || "Chưa có mô tả.", 90))}</p>
        <div class="catalog-card-actions">
          <button class="btn secondary" type="button" data-page="bookDetail" data-book-id="${book.id}">Xem chi tiết</button>
          <button class="btn primary" type="button" onclick="event.stopPropagation()" data-page="booking" data-book-id="${book.id}">Đặt sách</button>        
      </div> </div>
    </article>
  `;
}

function renderHistoryItem(loan) {
  const bookTitles = loan.items.map(item => item.bookTitle).join(" • ");
  const isOverdue = loan.status === "OPEN" && new Date(loan.dueDate) < new Date(new Date().setHours(0,0,0,0));
  const dueStyle = isOverdue ? 'color: #ef4444; font-weight: bold;' : 'color: #64748b;';
  const dueText = isOverdue ? `Quá hạn (${loan.dueDate})` : `Hạn: ${loan.dueDate}`;
  return `
    <div style="padding: 8px 0; border-bottom: 1px dashed #e2e8f0; margin-bottom: 8px;">
      <div style="display: flex; justify-content: space-between;">
        <strong>Phiếu #${loan.loanId}</strong>
        <span style="font-size: 13px; ${dueStyle}">${dueText}</span>
      </div>
      <p class="subtle" style="font-size: 14px; margin-top: 4px;">${escapeHtml(bookTitles)}</p>
    </div>
  `;
}

export function renderReaderPage(store) {
  const dashboard = store.getDashboard();
  const session = store.getSession();
  const currentUser = store.getCurrentUser?.() || null;
  const recommendationBooks = (dashboard.featuredBooks.length
    ? dashboard.featuredBooks
    : dashboard.newestBooks).slice(0, 4);

  const accountName = currentUser?.name || session?.name || "Độc giả";
  const accountEmail = currentUser?.email || session?.email || "reader@library.com";
  const accountRole = currentUser?.role || session?.role || "READER";

  const history = store.getMyHistory?.() || [];
  
  const today = new Date(new Date().setHours(0,0,0,0));
  const closedLoans = history.filter(h => h.status === "CLOSED");
  const openLoans = history.filter(h => h.status === "OPEN");
  
  const activeLoans = openLoans.filter(h => new Date(h.dueDate) >= today);
  const overdueLoans = openLoans.filter(h => new Date(h.dueDate) < today);

  const openHtml = activeLoans.length > 0 
    ? activeLoans.map(renderHistoryItem).join("") 
    : '<p class="subtle">Bạn không có phiếu nào đang mượn.</p>';
    
  const closedHtml = closedLoans.length > 0 
    ? closedLoans.map(renderHistoryItem).join("") 
    : '<p class="subtle">Bạn chưa trả cuốn sách nào.</p>';

  const overdueHtml = overdueLoans.length > 0
    ? overdueLoans.map(renderHistoryItem).join("")
    : '<p class="subtle">Bạn không có phiếu phạt/quá hạn nào. Tuyệt vời!</p>';

  return `
    <section class="reader-hero">
      <div class="reader-hero-copy">
        <p class="eyebrow">Tài khoản</p>
        <h1>Tài khoản độc giả</h1>
        <p class="subtle">Thông tin tài khoản và sách gợi ý.</p>
        <div class="actions">
          <button class="btn primary" type="button" data-page="home">Về trang chủ</button>
          <button class="btn secondary public-placeholder-btn" type="button" disabled>Cập nhật hồ sơ</button>
        </div>
      </div>

      <div id="reader-profile" class="reader-account-card">
        <p class="eyebrow">Trang cá nhân</p>
        <h3 class="card-title">${escapeHtml(accountName)}</h3>
        <div class="reader-account-grid">
          <div class="detail-item">
            <p class="eyebrow">Email</p>
            <strong>${escapeHtml(accountEmail)}</strong>
          </div>
          <div class="detail-item">
            <p class="eyebrow">Vai trò</p>
            <strong>${escapeHtml(accountRole)}</strong>
          </div>
          <div class="detail-item">
            <p class="eyebrow">Lịch sử mượn</p>
            <strong>${history.length} giao dịch</strong>
          </div>
          <div class="detail-item">
            <p class="eyebrow">Thông báo</p>
            <strong>0 tin mới</strong>
          </div>
        </div>
      </div>
    </section>

    <div class="grid-3">
      <div class="chip-card">
        <p class="eyebrow">Sách công khai</p>
        <h3 class="card-title">${formatNumber(dashboard.totalBooks)}</h3>
        <p class="subtle">Đầu sách đang hiển thị.</p>
      </div>
      <div class="chip-card">
        <p class="eyebrow">Sách gợi ý</p>
        <h3 class="card-title">${formatNumber(recommendationBooks.length)}</h3>
        <p class="subtle">Có thể xem ngay.</p>
      </div>
      <div class="chip-card">
        <p class="eyebrow">Mượn / trả</p>
        <h3 class="card-title">${activeLoans.length} đang mượn</h3>
        <p class="subtle">Quá hạn: ${overdueLoans.length} • Đã trả: ${closedLoans.length}</p>
      </div>
    </div>

    <div class="grid-2">
      <div id="reader-loan-history" class="table-card">
        <div class="section-head">
          <div>
            <p class="eyebrow">Lịch sử mượn</p>
            <h2>Danh sách giao dịch</h2>
          </div>
        </div>
        <div class="stack">
          <div class="list-item" style="display: block;">
            <strong>Phiếu đang mượn (${activeLoans.length})</strong>
            <div style="margin-top: 10px;">${openHtml}</div>
          </div>
          <div class="list-item" style="display: block;">
            <strong>Đã trả (${closedLoans.length})</strong>
            <div style="margin-top: 10px;">${closedHtml}</div>
          </div>
          <div class="list-item" style="display: block;">
            <strong style="color: #ef4444;">Quá hạn / tiền phạt (${overdueLoans.length})</strong>
            <div style="margin-top: 10px;">${overdueHtml}</div>
          </div>
        </div>
      </div>

      <div class="table-card">
        <div class="section-head">
          <div>
            <p class="eyebrow">Thông tin thành viên</p>
            <h2>Tóm tắt hồ sơ</h2>
          </div>
        </div>
        <div class="stack">
          <div class="list-item"><strong>Họ tên</strong><p class="subtle">${escapeHtml(accountName)}</p></div>
          <div class="list-item"><strong>Email</strong><p class="subtle">${escapeHtml(accountEmail)}</p></div>
          <div class="list-item"><strong>Trạng thái</strong><p class="subtle">Đang hoạt động.</p></div>
        </div>
      </div>
    </div>

    <section class="table-card storefront-panel">
      <div class="section-head">
        <div>
          <p class="eyebrow">Gợi ý đọc</p>
          <h2>Sách nên xem tiếp</h2>
        </div>
      </div>
      <div class="showcase-grid">
        ${recommendationBooks.length
          ? recommendationBooks.map(renderReaderRecommendation).join("")
          : '<div class="empty-state">Chưa có sách gợi ý.</div>'}
      </div>
    </section>
  `;
}