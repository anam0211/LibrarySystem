// ==========================================
// FILE: js/pages/loan-detail.js
// Logic xử lý xem chi tiết và nghiệp vụ trả/phạt
// ==========================================

const msgBox = document.getElementById('action-message');

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

// Hàm lấy ID từ URL (VD: ?id=PM-1042)
function getLoanIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || 'PM-1042'; // Lấy mặc định nếu không có
}

// 1. Tải dữ liệu chi tiết phiếu mượn
async function loadLoanDetail() {
    const loanId = getLoanIdFromUrl();
    document.getElementById('loanIdDisplay').innerText = `Phiếu mượn #${loanId}`;

    // TODO: Chỗ này sau này gọi API: fetchAPI(`/api/loans/${loanId}`)
    // Hiện tại dùng Mock Data để test giao diện
    console.log(`Đang tải dữ liệu cho phiếu ${loanId}...`);
}

// 2. NGHIỆP VỤ: XÁC NHẬN TRẢ SÁCH
const btnReturn = document.getElementById('btnReturnBook');
if (btnReturn) {
    btnReturn.addEventListener('click', async () => {
        const loanId = getLoanIdFromUrl();
        const confirmReturn = confirm(`Xác nhận độc giả đã trả cuốn sách của phiếu ${loanId}?`);
        
        if (confirmReturn) {
            // TODO: Gọi API PUT /api/loans/{id}/return
            showMessage("✅ Đã cập nhật trạng thái: ĐÃ TRẢ SÁCH thành công!");
            
            // Cập nhật lại UI ngay lập tức
            const badge = document.getElementById('loanStatusBadge');
            badge.className = 'badge success';
            badge.innerText = 'Đã trả';
            
            // Vô hiệu hóa các nút sau khi trả
            btnReturn.disabled = true;
            btnReturn.style.opacity = '0.5';
            document.getElementById('btnRenew').disabled = true;
            document.getElementById('btnReportLost').disabled = true;
        }
    });
}

// 3. NGHIỆP VỤ: GIA HẠN / BÁO MẤT
document.getElementById('btnRenew')?.addEventListener('click', () => {
    alert("Tính năng gia hạn: Sẽ mở popup chọn ngày hạn mới, gọi API gia hạn.");
});

document.getElementById('btnReportLost')?.addEventListener('click', () => {
    const confirmLost = confirm("CẢNH BÁO: Độc giả báo mất sách. Sẽ chuyển sang quy trình Phạt. Tiếp tục?");
    if (confirmLost) {
        showMessage("❌ Đã chuyển trạng thái phiếu sang BÁO MẤT. Vui lòng lập biên bản phạt!", false);
        const badge = document.getElementById('loanStatusBadge');
        badge.className = 'badge danger';
        badge.innerText = 'Báo mất';
    }
});

// Chạy khi load trang
document.addEventListener('DOMContentLoaded', () => {
    loadLoanDetail();
});