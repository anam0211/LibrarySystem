// ==========================================
// FILE: js/auth.js
// Xử lý Đăng nhập, Đăng ký và Nhận diện lỗi
// ==========================================

const loginForm = document.getElementById('loginForm');
if (loginForm) {
    const errorBox = document.getElementById('error-message'); 

    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        errorBox.style.display = 'none'; 

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetchAPI('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            if (response && response.ok) {
                const data = await response.json();
                
                // Kiểm tra theo chuẩn ApiResponse mới (code === 1000)
                if (data.code === 1000) {
                    // Lưu Token (chú ý: phải lấy từ data.result)
                    sessionStorage.setItem('token', data.result.token);
                    
                    // Lưu luôn thông tin User để hiển thị lên Topbar
                    sessionStorage.setItem('user_info', JSON.stringify({
                        fullName: data.result.fullName,
                        email: data.result.email,
                        role: data.result.role
                    }));

                    window.location.href = '/dashboard'; 
                } else {
                    errorBox.innerText = '❌ ' + (data.message || 'Sai email hoặc mật khẩu!');
                    errorBox.style.display = 'block';
                }
            } else {
                // Nếu backend trả về HTTP 400 (do GlobalExceptionHandler bắt lỗi)
                let errorMsg = 'Sai email hoặc mật khẩu!';
                try {
                    const errData = await response.json();
                    if (errData.message) errorMsg = errData.message;
                } catch(e) {}
                
                errorBox.innerText = '❌ ' + errorMsg;
                errorBox.style.display = 'block';
            }
        } catch (error) {
            errorBox.innerText = '⚠️ Không thể kết nối đến máy chủ!';
            errorBox.style.display = 'block';
        }
    });

    // Xử lý thông báo bị đá văng (từ utils.js)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('error') === 'need_login') {
        errorBox.innerText = '⚠️ Bạn cần đăng nhập để truy cập thư viện!';
        errorBox.style.display = 'block';
    } else if (urlParams.get('error') === 'session_expired') {
        errorBox.innerText = '⚠️ Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!';
        errorBox.style.display = 'block';
    }
}

// ==========================================
// XỬ LÝ ĐĂNG KÝ
// ==========================================
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    const messageBox = document.getElementById('message-box');

    registerForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        messageBox.style.display = 'none';

        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            messageBox.style.background = 'rgba(239, 107, 115, 0.14)';
            messageBox.style.color = 'var(--red)';
            messageBox.innerText = '❌ Mật khẩu xác nhận không khớp!';
            messageBox.style.display = 'block';
            return;
        }

        try {
            const response = await fetchAPI('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ fullName, email, password })
            });

            if (response && response.ok) {
                const data = await response.json();
                
                if (data.code === 1000) {
                    messageBox.style.background = 'rgba(44, 166, 111, 0.12)';
                    messageBox.style.color = 'var(--green)';
                    messageBox.innerText = '🎉 Đăng ký thành công! Đang chuyển hướng...';
                    messageBox.style.display = 'block';
                    
                    setTimeout(() => window.location.href = 'login.html', 1500);
                } else {
                    messageBox.style.background = 'rgba(239, 107, 115, 0.14)';
                    messageBox.style.color = 'var(--red)';
                    messageBox.innerText = '❌ ' + (data.message || 'Lỗi đăng ký!');
                    messageBox.style.display = 'block';
                }
            } else {
                let errorMsg = 'Email đã tồn tại hoặc dữ liệu không hợp lệ!';
                try {
                    const errData = await response.json();
                    if (errData.message) errorMsg = errData.message;
                } catch(e) {}
                
                messageBox.style.background = 'rgba(239, 107, 115, 0.14)';
                messageBox.style.color = 'var(--red)';
                messageBox.innerText = '❌ ' + errorMsg;
                messageBox.style.display = 'block';
            }
        } catch (error) {
            messageBox.style.background = 'rgba(239, 107, 115, 0.14)';
            messageBox.style.color = 'var(--red)';
            messageBox.innerText = '⚠️ Lỗi kết nối máy chủ!';
            messageBox.style.display = 'block';
        }
    });
}