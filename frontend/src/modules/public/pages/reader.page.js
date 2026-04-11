import { escapeHtml, formatNumber, truncate } from "../../../shared/utils/format.js";

export const readerMeta = {
  title: "Nguoi dung",
  description: "Khu vuc reader/public voi thong tin tai khoan, phieu muon va goi y sach."
};

const sampleLoans = [
  {
    title: "Clean Architecture",
    dueLabel: "Con 3 ngay",
    status: "Dang muon"
  },
  {
    title: "Spring In Action",
    dueLabel: "Qua han 1 ngay",
    status: "Can xu ly"
  },
  {
    title: "Domain-Driven Design",
    dueLabel: "Hen tra 12/04",
    status: "Da dat gia han"
  }
];

function renderReaderRecommendation(book) {
  return `
    <article class="showcase-card compact-showcase-card">
      <div class="showcase-cover compact-showcase-cover">
        ${book.primaryImageUrl
          ? `<img src="${escapeHtml(book.primaryImageUrl)}" alt="${escapeHtml(book.title)}" class="showcase-image">`
          : '<div class="showcase-fallback">Khong co bia</div>'}
      </div>
      <div class="showcase-body">
        <p class="eyebrow">${escapeHtml(book.primaryCategoryName || "Danh muc")}</p>
        <h3>${escapeHtml(book.title)}</h3>
        <p class="subtle">${escapeHtml(book.authorNames || "Chua co tac gia")}</p>
        <p class="mini">${escapeHtml(truncate(book.description || "Phu hop de dua vao khu vuc goi y cho reader.", 90))}</p>
        <div class="catalog-card-actions">
          <button class="btn secondary" type="button" data-page="bookDetail" data-book-id="${book.id}">Xem chi tiet</button>
          <button class="btn secondary public-placeholder-btn" type="button" disabled>Dat sach</button>
        </div>
      </div>
    </article>
  `;
}

export function renderReaderPage(store) {
  const dashboard = store.getDashboard();
  const recommendationBooks = (dashboard.featuredBooks.length
    ? dashboard.featuredBooks
    : dashboard.newestBooks).slice(0, 4);

  return `
    <section class="reader-hero">
      <div class="reader-hero-copy">
        <p class="eyebrow">Reader area</p>
        <h1>Khu vuc nguoi dung voi tai khoan, lich muon sach va goi y doc tiep</h1>
        <p class="subtle">Trang nay duoc chinh lai de khong con la scaffold rong. Khi module auth va circulation xong, ban co the thay mock data bang API that ma khong phai sua shell.</p>
        <div class="actions">
          <button class="btn primary" type="button" data-page="home">Ve trang chu</button>
          <button class="btn secondary" type="button" data-page="login">Dang nhap admin</button>
        </div>
      </div>

      <div class="reader-account-card">
        <p class="eyebrow">Tai khoan mau</p>
        <h3 class="card-title">Reader Demo</h3>
        <div class="reader-account-grid">
          <div class="detail-item">
            <p class="eyebrow">Trang thai</p>
            <strong>Active</strong>
          </div>
          <div class="detail-item">
            <p class="eyebrow">Phieu dang muon</p>
            <strong>${formatNumber(sampleLoans.length)}</strong>
          </div>
          <div class="detail-item">
            <p class="eyebrow">Danh muc yeu thich</p>
            <strong>${formatNumber(Math.max(dashboard.topCategories?.length || 0, 3))}</strong>
          </div>
          <div class="detail-item">
            <p class="eyebrow">Thong bao</p>
            <strong>2 moi</strong>
          </div>
        </div>
      </div>
    </section>

    <div class="grid-3">
      <div class="chip-card">
        <p class="eyebrow">Loans</p>
        <h3 class="card-title">${formatNumber(sampleLoans.length)}</h3>
        <p class="subtle">So phieu dang can theo doi tren giao dien reader.</p>
      </div>
      <div class="chip-card">
        <p class="eyebrow">Recommendations</p>
        <h3 class="card-title">${formatNumber(recommendationBooks.length)}</h3>
        <p class="subtle">Sach de dua vao khu vuc de xuat doc tiep.</p>
      </div>
      <div class="chip-card">
        <p class="eyebrow">Catalog</p>
        <h3 class="card-title">${formatNumber(dashboard.totalBooks)}</h3>
        <p class="subtle">Tong dau sach san sang tra cuu tu trang cong khai.</p>
      </div>
    </div>

    <div class="grid-2">
      <div class="table-card">
        <div class="section-head">
          <div>
            <p class="eyebrow">Lich muon sach</p>
            <h2>Nhung the hien thi nen co trong user area</h2>
          </div>
        </div>
        <div class="stack">
          ${sampleLoans
            .map(
              (loan) => `
                <div class="list-item">
                  <div class="list-item-head">
                    <strong>${escapeHtml(loan.title)}</strong>
                    <span class="status info">${escapeHtml(loan.status)}</span>
                  </div>
                  <p class="subtle">${escapeHtml(loan.dueLabel)}</p>
                </div>
              `
            )
            .join("")}
        </div>
      </div>

      <div class="table-card">
        <div class="section-head">
          <div>
            <p class="eyebrow">Tinh nang reader</p>
            <h2>Module user co the noi backend sau nay</h2>
          </div>
        </div>
        <div class="stack">
          <div class="list-item"><strong>Ho so tai khoan</strong><p class="subtle">Thong tin thanh vien, trang thai khoa/mo va ma doc gia.</p></div>
          <div class="list-item"><strong>Lich su muon tra</strong><p class="subtle">Tabs Dang muon / Da tra / Qua han co the noi truc tiep voi circulation APIs.</p></div>
          <div class="list-item"><strong>Thong bao nhac han</strong><p class="subtle">Hien thi du lieu tu notification service hoac cronjob email.</p></div>
          <div class="list-item"><strong>Danh sach yeu thich</strong><p class="subtle">Giu san khung de sau nay noi bookmark, reserve va recommendation.</p></div>
        </div>
      </div>
    </div>

    <section class="table-card storefront-panel">
      <div class="section-head">
        <div>
          <p class="eyebrow">Goi y doc tiep</p>
          <h2>Cac sach noi bat cho khu vuc nguoi dung</h2>
        </div>
      </div>
      <div class="showcase-grid">
        ${recommendationBooks.length
          ? recommendationBooks.map(renderReaderRecommendation).join("")
          : '<div class="empty-state">Dang cho backend tra du lieu sach de goi y cho reader.</div>'}
      </div>
    </section>
  `;
}
