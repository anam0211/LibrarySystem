export async function loadHistoryPage(store) {
  await store.loadMyHistory();
}

export const historyMeta = {
  title: "Lịch sử mượn sách",
  description: "Theo dõi trạng thái các tài liệu bạn đã đặt trước hoặc đang mượn."
};

function translateStatus(status) {
  if (status === "OPEN") return `<span class="status info">ĐANG HOẠT ĐỘNG</span>`;
  if (status === "CLOSED") return `<span class="status success">ĐÃ HOÀN TẤT</span>`;
  if (status === "CANCELLED") return `<span class="status secondary">ĐÃ HỦY</span>`;
  return `<span class="status">${status}</span>`;
}

export function renderHistoryPage(store) {
  const myHistory = store ? store.getMyHistory() : [];

  return `
    <div style="max-width: 1000px; margin: 0 auto; padding: 20px 0;">
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 24px; color: #0f172a; margin-bottom: 8px;">Lịch sử giao dịch</h2>
        <p style="color: #64748b;">Xem lại danh sách các sách bạn đã đặt trước, đang mượn hoặc đã trả tại thư viện.</p>
      </div>

      <div class="table-card">
        <div class="table-wrap">
          <table class="table" style="width: 100%; text-align: left;">
            <thead>
              <tr>
                <th style="padding: 16px;">Mã phiếu</th>
                <th style="padding: 16px;">Tài liệu mượn</th>
                <th style="padding: 16px;">Hạn trả (Dự kiến)</th>
                <th style="padding: 16px;">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              ${myHistory.length === 0 ? `
                <tr>
                  <td colspan="4" style="text-align: center; padding: 40px; color: #64748b;">
                    Bạn chưa có lịch sử mượn sách nào. Hãy khám phá danh mục sách và đặt mượn nhé!
                  </td>
                </tr>
              ` : myHistory.map(loan => `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 16px; vertical-align: top;">
                    <strong>#${loan.loanId}</strong>
                  </td>
                  
                  <td style="padding: 16px; vertical-align: top;">
                    <ul style="margin: 0; padding-left: 16px; color: #334155;">
                      ${loan.items.map(item => `
                        <li style="margin-bottom: 6px;">
                          ${item.bookTitle}
                          ${item.itemStatus === 'RETURNED' 
                            ? `<span style="font-size: 11px; font-weight: 500; color: #10b981; background: #d1fae5; padding: 2px 6px; border-radius: 4px; margin-left: 8px;">Đã trả</span>` 
                            : ''}
                        </li>
                      `).join('')}
                    </ul>
                  </td>
                  
                  <td style="padding: 16px; color: #475569; vertical-align: top;">
                    ${loan.dueDate}
                  </td>
                  
                  <td style="padding: 16px; vertical-align: top;">
                    ${translateStatus(loan.status)}
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

export function bindHistoryPage({ root, store }) {
  // Dành cho các xử lý sự kiện nút bấm trên trang (nếu có sau này)
  // Hiện tại trang chỉ mang tính chất hiển thị (Read-only) nên không cần bind sự kiện phức tạp.
}