import { escapeHtml } from "../../../shared/utils/format.js";

export const bookingMeta = {
  title: "Đặt trước tài liệu",
  description: "Xác nhận thông tin đặt sách."
};

// 1. Nhận thêm tham số state vào hàm render
export function renderBookingPage(store, state) {
  const bookId = state?.bookId || "Chưa xác định"; // Lấy ID chuẩn xác

  return `
    <div class="public-content" style="max-width: 600px; margin: 40px auto;">
      <section class="auth-card" style="box-shadow: var(--shadow-sm);">
        <div class="section-head" style="margin-bottom: 24px;">
          <div>
            <p class="eyebrow">Xác nhận yêu cầu</p>
            <h2>Đặt trước tài liệu</h2>
          </div>
        </div>
        
        <div class="auth-inline-note" style="margin-bottom: 20px;">
          <span>Bạn đang yêu cầu đặt trước mã sách: <strong style="color: var(--brand-warm); font-size: 1.1rem;">#${escapeHtml(bookId)}</strong>. Tài liệu sẽ được giữ cho bạn tại quầy thủ thư trong vòng 48 giờ kể từ thời điểm hẹn lấy.</span>
        </div>

        <form id="booking-form" class="stack">
          <div class="field">
            <label for="pickup-date">Ngày hẹn lấy sách dự kiến</label>
            <input type="date" id="pickup-date" name="pickupDate" required>
          </div>
          
          <div class="actions" style="margin-top: 24px; justify-content: flex-end;">
            <button class="btn secondary" type="button" data-page="bookDetail" data-book-id="${bookId}">Hủy bỏ</button>
            <button class="btn primary" type="submit">Xác nhận đặt sách</button>
          </div>
        </form>
      </section>
    </div>
  `;
}

// 2. Nhận thêm pageState vào hàm bind
export function bindBookingPage({ root, pageState, store, navigateToPage }) {
  const form = root.querySelector('#booking-form');
  
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 1. Lấy dữ liệu từ form
    const formData = new FormData(form);
    const pickupDate = formData.get("pickupDate");
    const bookId = pageState?.bookId;

    // 2. Chặn thao tác spam click (UI/UX)
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Đang xử lý...";
    }

    try {
      // 3. Gọi API đặt trước sách
      await store.reserveBook({
        bookId: Number(bookId),
        pickupDate: pickupDate
      });

      // 4. Báo thành công và chuyển hướng về trang Lịch sử
      alert(`Tuyệt vời! Yêu cầu đặt trước sách #${bookId} đã được ghi nhận.\nVui lòng đến thư viện vào ngày ${pickupDate} để nhận sách.`);
      
      // Đẩy người dùng về trang Tài khoản (Reader) để xem ngay phiếu vừa đặt
      navigateToPage("reader", { message: "Đặt trước sách thành công!" }, { scrollTop: true });

    } catch (error) {
      // Xử lý lỗi (Ví dụ: hết sách, lỗi mạng...)
      alert(error.message || "Có lỗi xảy ra khi đặt sách. Vui lòng thử lại sau.");
      
      // Mở lại nút bấm nếu có lỗi
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Xác nhận đặt sách";
      }
    }
  });
}