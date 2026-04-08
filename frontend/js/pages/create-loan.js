// ==========================================
// FILE: js/pages/create-loan.js
// Logic xử lý form tạo phiếu mượn
// ==========================================

const msgBox = document.getElementById('loan-message');

function showMessage(msg, isSuccess = true) {
    msgBox.style.display = 'block';
    msgBox.innerText = msg;
    if (isSuccess) {
        msgBox.style.background = 'rgba(44, 166, 111, 0.12)';
        msgBox.style.color = 'var(--green)';
    } else {
        msgBox.style.background = 'rgba(239, 107, 115, 0.14)';
        msgBox.style.color = 'var(--red)';
    }
}

// Hàm format ngày chuẩn ISO (YYYY-MM-DD) để nhét vào thẻ <input type="date">
function formatDateForInput(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 1. Tự động thiết lập Ngày mượn và Hạn trả khi mở trang
function setupDefaultDates() {
    const borrowDateInput = document.getElementById('borrowDate');
    const dueDateInput = document.getElementById('dueDate');

    const today = new Date();
    // Hạn trả mặc định = Hôm nay + 14 ngày
    const due = new Date();
    due.setDate(today.getDate() + 14);

    if (borrowDateInput) borrowDateInput.value = formatDateForInput(today);
    if (dueDateInput) dueDateInput.value = formatDateForInput(due);
}

// 2. Xử lý khi bấm nút "Xác nhận tạo phiếu"
const createLoanForm = document.getElementById('createLoanForm');
if (createLoanForm) {
    createLoanForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Chặn việc tải lại trang

        const payload = {
            readerId: document.getElementById('readerId').value,
            bookId: document.getElementById('bookId').value,
            borrowDate: document.getElementById('borrowDate').value,
            dueDate: document.getElementById('dueDate').value,
            note: document.getElementById('loanNote').value
        };

        // TODO: Chỗ này sẽ gọi API POST /api/loans của Spring Boot
        console.log("Dữ liệu chuẩn bị gửi xuống Backend:", payload);
        
        showMessage(`Tạo phiếu mượn thành công cho mã sách ${payload.bookId}! Đang chuyển hướng...`, true);
        
        
        window.location.href = 'loans.html';
    
    });
}

// Chạy khởi tạo khi web load xong
document.addEventListener('DOMContentLoaded', () => {
    // Đợi 100ms để đảm bảo layout Component đã vẽ xong
    setTimeout(() => {
        setupDefaultDates();
    }, 100);
});