// ==========================================
// FILE: js/pages/profile-page.js
// Logic xử lý hiển thị và cập nhật Hồ sơ
// ==========================================

const msgBox = document.getElementById('profile-message');

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
    // Tự động ẩn sau 4 giây
    setTimeout(() => { msgBox.style.display = 'none'; }, 4000);
}

// 1. Tải thông tin cá nhân đổ vào Form
async function loadProfileData() {
    try {
        const response = await fetchAPI('/users/me', { method: 'GET' });
        if (response && response.ok) {
            const user = await response.json();
            
            document.getElementById('profileName').value = user.fullName || '';
            document.getElementById('profileEmail').value = user.email || '';
            document.getElementById('profileRole').value = user.role === 'ROLE_ADMIN' ? 'Quản trị viên' : 'Độc giả BookHub';
        }
    } catch (error) {
        console.error("Lỗi khi tải thông tin form profile:", error);
        showMessage("Không thể tải thông tin từ máy chủ!", false);
    }
}

// 2. Xử lý Cập nhật tên (Chờ Backend làm API)
const updateProfileForm = document.getElementById('updateProfileForm');
if (updateProfileForm) {
    updateProfileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newName = document.getElementById('profileName').value;
        
        // TODO: Chỗ này sau này bạn sẽ gọi API PUT /users/me
        // try {
        //     const res = await fetchAPI('/users/me', { method: 'PUT', body: JSON.stringify({ fullName: newName }) });
        //     if(res.ok) showMessage("Cập nhật tên thành công!");
        // }
        
        showMessage(`Đã ghi nhận yêu cầu đổi tên thành: ${newName} (Chờ API Backend)`, true);
    });
}

// 3. Xử lý Đổi mật khẩu (Chờ Backend làm API)
const changePasswordForm = document.getElementById('changePasswordForm');
if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const oldPass = document.getElementById('oldPassword').value;
        const newPass = document.getElementById('newPassword').value;
        const confirmPass = document.getElementById('confirmNewPassword').value;

        if (newPass !== confirmPass) {
            showMessage("Mật khẩu xác nhận không khớp!", false);
            return;
        }

        // TODO: Chỗ này sau này bạn sẽ gọi API POST /auth/change-password
        
        showMessage("Yêu cầu đổi mật khẩu đã được gửi! (Chờ API Backend)", true);
        changePasswordForm.reset(); // Xóa trắng form mật khẩu
    });
}

// Chạy khi Load trang
document.addEventListener('DOMContentLoaded', () => {
    loadProfileData();
});