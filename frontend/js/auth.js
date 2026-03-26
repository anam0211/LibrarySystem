//login
const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const emailInput = document.getElementById('email').value;
        const passwordInput = document.getElementById('password').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailInput, password: passwordInput })
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.token || data.accessToken);
                window.location.href = '/dashboard'; 
            } else {
                alert('❌ Sai email hoặc mật khẩu. Vui lòng thử lại!');
            }
        } catch (error) {
            console.error("Lỗi:", error);
            alert('⚠️ Không thể kết nối đến Server!');
        }
    });
}

//register
const registerForm = document.getElementById('registerForm');

if (registerForm) {
    registerForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, email, password })
            });

            if (response.ok) {
                alert('🎉 Đăng ký thành công! Đang chuyển hướng sang Đăng nhập...');
                window.location.href = '/login';
            } else {
                const errorText = await response.text();
                alert('❌ Lỗi: ' + (errorText || 'Email đã tồn tại!'));
            }
        } catch (error) {
            console.error("Lỗi:", error);
            alert('⚠️ Lỗi kết nối Server!');
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('error') === 'need_login') {
        // Tạo một thông báo lỗi chuẩn Bootstrap cực đẹp
        const loginCard = document.querySelector('.auth-card');
        if (loginCard) {
            const alertBox = document.createElement('div');
            alertBox.className = 'alert alert-warning text-center fw-bold p-2 small mb-4';
            alertBox.innerText = '⚠️ Bạn cần đăng nhập để xem trang đó!';
            loginCard.prepend(alertBox); // Nhét thông báo vào đầu Form
        }
    }
});