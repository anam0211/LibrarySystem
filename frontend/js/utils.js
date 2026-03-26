// Hàm kiểm tra Token
function requireAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        document.body.style.display = 'none';
        window.location.href = '/login?error=need_login';
        return null; 
    }
    return token; 
}

// Hàm đăng xuất
function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login';
}