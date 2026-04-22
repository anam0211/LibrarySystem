export const circulationMeta = {
  title: "Lưu thông sách",
  description: "Xử lý quy trình mượn sách, trả sách và quản lý trạng thái phiếu mượn."
};

const sampleTransactions = [
  { reader: "Le Minh", book: "Clean Architecture", status: "Borrowing", dueDate: "2026-04-10" },
  { reader: "Hoang Mai", book: "Spring in Action", status: "Overdue", dueDate: "2026-03-30" },
  { reader: "Tran Thu", book: "DDD Distilled", status: "Returned", dueDate: "2026-04-01" }
];

function getStatusBadge(status, processId) {
  const isUnprocessed = !processId || processId === "null" || processId === "undefined" || processId === "";
  if (status === "OPEN" && isUnprocessed) {
    return `<span class="status warning" style="background: #fef3c7; color: #92400e;">WAITING</span>`;
  }
  
  const statusClass = status === "OPEN" ? "info" : (status === "CLOSED" ? "success" : "secondary");
  return `<span class="status ${statusClass}">${status}</span>`;
}

export function renderCirculationPage(store) {
  const recentTransactions = store ? store.getRecentTransactions() : [];
  return `
    <div class="grid-2">
      <div class="table-card">
        <div class="section-head">
          <div>
            <p class="eyebrow">Nghiệp vụ</p>
            <h3 class="card-title">Tạo phiếu mượn mới</h3>
          </div>
        </div>
        <form id="checkout-form" class="stack" style="padding: 20px; gap: 15px;">
          <div class="field">
            <label class="label">ID Độc giả</label>
            <input type="number" name="borrowerId" class="input" placeholder="Nhập mã người dùng..." required>
          </div>
          <div class="field">
            <label class="label">ID Sách</label>
            <input type="number" name="bookId" class="input" placeholder="Nhập mã sách..." required>
          </div>
          <div class="field">
            <label class="label">Số ngày mượn</label>
            <input type="number" name="dueDays" class="input" value="14">
          </div>
          <button type="submit" class="btn primary">Xác nhận cho mượn</button>
        </form>
      </div>

      <div class="table-card">
        <div class="section-head">
          <div>
            <p class="eyebrow">Nghiệp vụ</p>
            <h3 class="card-title">Xử lý trả sách</h3>
          </div>
        </div>
        <form id="return-form" class="stack" style="padding: 20px; gap: 15px;">
          <div class="field">
            <label class="label">Mã phiếu mượn (Loan ID)</label>
            <input type="number" name="loanId" class="input" placeholder="Nhập mã phiếu..." required>
          </div>
          <div class="field">
            <label class="label">Mã sách (Book ID)</label>
            <input type="number" name="bookId" class="input" placeholder="Nhập mã sách cần trả..." required>
          </div>
          <button type="submit" class="btn secondary">Xác nhận trả sách</button>
        </form>
      </div>
    </div>

    <div class="table-card" style="margin-top: 20px;">
      <div class="section-head">
        <div>
          <p class="eyebrow">Nhật ký</p>
          <h3 class="card-title">Các giao dịch gần đây</h3>
        </div>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>Người mượn</th><th>Đầu sách</th><th>Trạng thái</th><th>Hạn trả</th><th>Thao tác</th></tr></thead>
          <tbody>
            ${recentTransactions.length === 0 ? `<tr><td colspan="5">Chưa có giao dịch nào</td></tr>` : 
              recentTransactions.map(item => `
              <tr>
                <td><strong>${item.reader}</strong><br><small>Phiếu #${item.loanId}</small></td>
                <td>${item.book}</td> <td>${getStatusBadge(item.status, item.processId)}</td>
                <td>${item.dueDate}</td>
                <td>
                  <button class="btn secondary" style="padding: 4px 8px; font-size: 12px;" type="button" 
                          data-action="view-details" 
                          data-loan-id="${item.loanId}" 
                          data-user-id="${item.userId}" 
                          data-reader-name="${item.reader}"         data-book-ids="${item.bookIds ? item.bookIds.join(', ') : ''}"
                          data-book-titles="${item.book}"           data-status="${item.status}"
                          data-process-id="${item.processId}">Chi tiết
                  </button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
    <div id="detail-modal" class="modal-overlay">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Chi tiết giao dịch</h3>
          <button type="button" class="modal-close-btn" id="modal-close-x">&times;</button>
        </div>
        <div class="modal-body">
          <p><strong>Mã Phiếu (Loan ID):</strong> <span id="modal-val-loan"></span></p>
          <p><strong>Độc Giả:</strong> <span id="modal-val-user"></span> - <strong style="color: var(--brand-primary);"><span id="modal-val-reader-name"></span></strong></p>
          <div style="margin-top: 16px;">
            <p style="margin-bottom: 8px;"><strong>Tài liệu mượn:</strong></p>
            <div id="modal-book-list" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px 12px; max-height: 150px; overflow-y: auto;">
              </div>
          </div>
        </div>
        <div style="margin-top: 24px; display: flex; justify-content: flex-end; gap: 12px; align-items: center;">
          <button type="button" class="btn primary" id="modal-confirm-btn" style="display: none; border-radius: 30px; padding: 8px 20px;">Xác nhận đặt sách</button>
          <button type="button" class="btn" id="modal-cancel-btn" style="display: none; background: #fff; color: #ef4444; border: 1px solid #ef4444; border-radius: 30px; padding: 8px 20px; font-weight: 500; cursor: pointer;">Hủy đơn</button>
          <button type="button" class="btn secondary" id="modal-close-btn" style="border-radius: 30px; padding: 8px 20px;">Đóng</button>
        </div>
      </div>
    </div>
  `;
}
export function bindCirculationPage({ root, store, refreshPage }) {

  const checkoutForm = root.querySelector("#checkout-form");
  checkoutForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(checkoutForm);
    const payload = {
      borrowerId: Number(formData.get("borrowerId")),
      dueDays: Number(formData.get("dueDays")),
      items: [{ bookId: Number(formData.get("bookId")), qty: 1 }]
    };

    try {
      await store.checkout(payload);
      alert("Tạo phiếu mượn thành công!");
      checkoutForm.reset();
      if (typeof refreshPage === "function") refreshPage();
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  });

  const returnForm = root.querySelector("#return-form");
  returnForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(returnForm);
    const loanId = Number(formData.get("loanId"));
    const bookId = Number(formData.get("bookId"));

    try {
      await store.returnBook(loanId, bookId);
      alert("Đã trả sách và cập nhật kho thành công!");
      returnForm.reset();
      if (typeof refreshPage === "function") refreshPage();
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  });

  const detailModal = root.querySelector("#detail-modal");
  const modalValLoan = root.querySelector("#modal-val-loan");
  const modalValUser = root.querySelector("#modal-val-user");
  const modalValBook = root.querySelector("#modal-val-book");
  const closeModalBtns = root.querySelectorAll("#modal-close-x, #modal-close-btn");
  const modalConfirmBtn = root.querySelector("#modal-confirm-btn");
  const modalCancelBtn = root.querySelector("#modal-cancel-btn");
  const modalValReaderName = root.querySelector("#modal-val-reader-name");
  const modalValBookTitles = root.querySelector("#modal-val-book-titles");
  const modalBookList = root.querySelector("#modal-book-list");
  
  root.querySelectorAll('[data-action="view-details"]').forEach(btn => {
    btn.addEventListener("click", () => {
      if (modalValLoan) modalValLoan.textContent = btn.dataset.loanId;
      if (modalValUser) modalValUser.textContent = btn.dataset.userId;
      if (modalValBook) modalValBook.textContent = btn.dataset.bookIds || "N/A";
      if (modalValReaderName) modalValReaderName.textContent = btn.dataset.readerName || "N/A";
      if (modalValBookTitles) modalValBookTitles.textContent = btn.dataset.bookTitles || "N/A";
      if (modalBookList) {
        const ids = (btn.dataset.bookIds || "").split(",").map(id => id.trim()).filter(Boolean);
        const titles = (btn.dataset.bookTitles || "").split("•").map(t => t.trim()).filter(Boolean);

        if (ids.length === 0) {
          modalBookList.innerHTML = '<div style="padding: 8px 0; color: #64748b;">Không có dữ liệu sách</div>';
        } else {
          modalBookList.innerHTML = ids.map((id, index) => `
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px dashed #cbd5e1;">
              <span style="color: #64748b; white-space: nowrap; font-size: 13px;">Mã sách: <strong style="color: #334155;">#${id}</strong></span>
              <span style="text-align: right; color: #0f172a; font-weight: 500; font-size: 14px;">${titles[index] || "Chưa cập nhật tên"}</span>
            </div>
          `).join('');
          
          if (modalBookList.lastElementChild) {
             modalBookList.lastElementChild.style.borderBottom = "none";
          }
        }
      }

      if (modalConfirmBtn) {
        const processId = btn.dataset.processId;
        
        const isUnprocessed = !processId || processId === "null" || processId === "undefined" || processId === "";

        if (btn.dataset.status === "OPEN" && isUnprocessed) {
        if (modalConfirmBtn) {
          modalConfirmBtn.style.display = "block"; 
          modalConfirmBtn.dataset.loanId = btn.dataset.loanId; 
        }
        if (modalCancelBtn) {
          modalCancelBtn.style.display = "block";  
          modalCancelBtn.dataset.loanId = btn.dataset.loanId; 
        }
        } else {
          if (modalConfirmBtn) modalConfirmBtn.style.display = "none";  
          if (modalCancelBtn) modalCancelBtn.style.display = "none";     
        }
      }

      if (detailModal) detailModal.classList.add("is-active");
    });
  });

  closeModalBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      if (detailModal) detailModal.classList.remove("is-active");
    });
  });

  detailModal?.addEventListener("click", (e) => {
    if (e.target === detailModal) {
      detailModal.classList.remove("is-active");
    }
  });

  modalConfirmBtn?.addEventListener("click", async () => {
    const loanId = Number(modalConfirmBtn.dataset.loanId);
    if (!loanId) return;

    try {
      modalConfirmBtn.disabled = true;
      modalConfirmBtn.textContent = "Đang xử lý...";

      await store.confirmReservation(loanId);
      
      alert(`Đã xác nhận thành công phiếu đặt trước #${loanId}!`);
      detailModal.classList.remove("is-active");
      
      if (typeof refreshPage === "function") refreshPage();
      
    } catch (err) {
      alert("Lỗi: " + (err.message || "Không thể xác nhận phiếu lúc này."));
    } finally {
      modalConfirmBtn.disabled = false;
      modalConfirmBtn.textContent = "Xác nhận đặt sách";
    }
  });

  modalCancelBtn?.addEventListener("click", async () => {
    const loanId = Number(modalCancelBtn.dataset.loanId);
    if (!loanId) return;

    const isConfirmed = window.confirm(`Bạn có chắc chắn muốn hủy đơn đặt sách #${loanId} này không?`);
    
    if (!isConfirmed) return; 

    try {
      modalCancelBtn.disabled = true;
      modalCancelBtn.textContent = "Đang xử lý...";

      await store.cancelReservation(loanId, "Đã hủy");

      alert(`Đã hủy phiếu #${loanId} thành công!`);
      detailModal.classList.remove("is-active");

      if (typeof refreshPage === "function") refreshPage();

    } catch (err) {
      alert("Lỗi: " + (err.message || "Không thể hủy phiếu lúc này."));
    } finally {
      modalCancelBtn.disabled = false;
      modalCancelBtn.textContent = "Hủy đơn";
    }
  });
}