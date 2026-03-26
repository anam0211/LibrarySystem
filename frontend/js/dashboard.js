document.addEventListener('DOMContentLoaded', async function() {
    const token = requireAuth();
    if (!token) return; 

    try {
        const response = await fetch('/api/users/me', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const user = await response.json();
            
            document.getElementById('userNameDisplay').innerHTML = `Xin chào, <strong>${user.fullName}</strong>`;

            // Bật bảng Quản lý Người dùng nếu là Admin
            const adminPanel = document.getElementById('adminPanel');
            if (adminPanel && (user.role === 'ADMIN' || user.role === 'ROLE_ADMIN')) {
                adminPanel.style.display = 'block';
            }
        } else {
            logout(); 
        }
    } catch (error) {
        console.error("Lỗi:", error);
    }
});