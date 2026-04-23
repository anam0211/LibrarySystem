export const notificationsMeta = {
  title: "Thông báo",
  description: "Trang hiển thị lịch sử thông báo và lời nhắc hệ thống."
};

const statusMap = { 'PENDING': 'Đang chờ', 'SENT': 'Đã gửi', 'FAILED': 'Thất bại', 'CANCELLED': 'Đã hủy' };
const typeMap = { 'DUE_SOON': 'Sắp đến hạn', 'OVERDUE': 'Quá hạn', 'FINE_CREATED': 'Thông báo phạt', 'GENERIC': 'Hệ thống' };
const channelMap = { 'INAPP': 'Trên web', 'EMAIL': 'Qua Email' };

// ==========================================
// 1. HÀM LOAD (Gọi đúng hàm đã định nghĩa trong Store)
// ==========================================
export async function loadNotificationsPage(store) {
  await store.loadMyNotifications();
}

export function renderNotificationsPage(store) {
  // Lấy dữ liệu từ cache của Store
  const notificationsList = store ? store.getMyNotifications() : [];

  return `
    <div style="max-width: 1000px; margin: 0 auto; padding: 20px 0;">
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 24px; color: #0f172a; margin-bottom: 8px;">Lịch sử thông báo</h2>
        <p style="color: #64748b;">Xem lại các thông báo và lời nhắc từ hệ thống.</p>
      </div>

      <div class="table-card">
        <div class="table-wrap">
          <table class="table" style="width: 100%; text-align: left;">
            <thead>
              <tr>
                <th style="padding: 16px;">Tiêu đề</th>
                <th style="padding: 16px;">Loại</th>
                <th style="padding: 16px;">Kênh</th>
                <th style="padding: 16px;">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              ${notificationsList.length === 0 ? `
                <tr>
                  <td colspan="4" style="text-align: center; padding: 40px; color: #64748b;">
                    Bạn chưa có thông báo nào từ hệ thống.
                  </td>
                </tr>
              ` : notificationsList.map(notif => `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 16px;">
                    <strong>${notif.subject || 'Thông báo hệ thống'}</strong>
                    <div style="font-size: 13px; color: #64748b; margin-top: 4px;">
                      ${notif.body || ''}
                    </div>
                  </td>
                  <td style="padding: 16px;">${typeMap[notif.type] || notif.type}</td>
                  <td style="padding: 16px;">${channelMap[notif.channel] || notif.channel}</td>
                  <td style="padding: 16px;">
                    <span style="font-size: 11px; font-weight: 500; border-radius: 4px; padding: 2px 6px; 
                                 background: ${notif.status === 'SENT' ? '#d1fae5' : '#fef3c7'}; 
                                 color: ${notif.status === 'SENT' ? '#10b981' : '#d97706'};">
                        ${statusMap[notif.status] || notif.status}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// ==========================================
// 3. HÀM BIND
// ==========================================
export function bindNotificationsPage({ root, store }) {}