import { formatNumber } from "../../../shared/utils/format.js";

export const operationsMeta = {
  title: "Báo cáo vận hành",
  description: "Tổng hợp nhanh người dùng và chỉ số vận hành cơ bản để theo dõi hệ thống."
};

export function renderOperationsPage(store) {
  const overview = store.getOperationsOverview();

  return `
    <div class="stats-grid">
      <div class="stat-card">
        <p class="eyebrow">Tổng người dùng</p>
        <div class="stat-value">${formatNumber(overview.totalUsers)}</div>
        <p class="mini">Toàn bộ tài khoản trong hệ thống.</p>
      </div>
      <div class="stat-card">
        <p class="eyebrow">Đang hoạt động</p>
        <div class="stat-value">${formatNumber(overview.activeUsers)}</div>
        <p class="mini">Sẵn sàng tiếp tục sử dụng.</p>
      </div>
      <div class="stat-card">
        <p class="eyebrow">Tạm khóa</p>
        <div class="stat-value">${formatNumber(overview.suspendedUsers)}</div>
        <p class="mini">Cần theo dõi hoặc mở lại khi đủ điều kiện.</p>
      </div>
      <div class="stat-card">
        <p class="eyebrow">Quá hạn</p>
        <div class="stat-value">${formatNumber(overview.overdueRecords)}</div>
        <p class="mini">Sẽ chính xác hơn khi module mượn trả hoàn thiện.</p>
      </div>
    </div>

    <div class="grid-2">
      <div class="table-card">
        <div class="section-head">
          <div>
            <p class="eyebrow">Vai trò</p>
            <h3 class="card-title">Phân bổ nhân sự</h3>
          </div>
        </div>
        <div class="stack">
          <div class="list-item"><strong>Admin</strong><p class="subtle">${formatNumber(overview.adminUsers)} tài khoản</p></div>
          <div class="list-item"><strong>Thủ thư</strong><p class="subtle">${formatNumber(overview.librarianUsers)} tài khoản</p></div>
          <div class="list-item"><strong>Độc giả</strong><p class="subtle">${formatNumber(overview.readerUsers)} tài khoản</p></div>
        </div>
      </div>

      <div class="table-card">
        <div class="section-head">
          <div>
            <p class="eyebrow">Vận hành</p>
            <h3 class="card-title">Chỉ số đang theo dõi</h3>
          </div>
        </div>
        <div class="stack">
          <div class="list-item"><strong>Lượt mượn</strong><p class="subtle">${formatNumber(overview.borrowingRecords)} bản ghi hiện có.</p></div>
          <div class="list-item"><strong>Đã trả hôm nay</strong><p class="subtle">${formatNumber(overview.returnedToday)} lượt trả trong ngày.</p></div>
          <div class="list-item"><strong>Phiếu quá hạn</strong><p class="subtle">${formatNumber(overview.overdueRecords)} trường hợp cần chú ý.</p></div>
        </div>
      </div>
    </div>
  `;
}
