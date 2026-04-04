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
}function requireAuth() {
    const token = sessionStorage.getItem('token');
    if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
        document.body.style.display = 'none';
        sessionStorage.removeItem('token');
        window.location.href = '/login';
        return null; 
    }
    return token; 
}

function logout() {
    sessionStorage.removeItem('token');
  
    window.location.href = '/login';
}

// Tự động hiển thị tên người dùng lên Topbar khi trang đã load xong
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const userNameElement = document.getElementById('topbar-user-name');
        const userRoleElement = document.getElementById('topbar-user-role');
        
        const currentUser = JSON.parse(sessionStorage.getItem('user_info'));

        if (currentUser && userNameElement) {
            userNameElement.innerText = currentUser.fullName || 'Độc giả';
            userRoleElement.innerText = currentUser.role === 'ROLE_ADMIN' ? 'Quản trị viên' : 'Độc giả';
        }
    }, 200);
});


/**
 * @param {string} elementId 
 * @param {string} componentPath 
 */
async function loadComponent(elementId, componentPath) {
    try {
        const response = await fetch(componentPath);
        if (!response.ok) throw new Error(`Không thể tải ${componentPath}`);
        
        const html = await response.text();
        document.getElementById(elementId).innerHTML = html;
    } catch (error) {
        console.error("Lỗi lắp ráp giao diện:", error);
    }
}


async function initLayout() {
    // 1. Lắp ráp Sidebar và Topbar
    await loadComponent('sidebar-container', 'components/sidebar.html');
    await loadComponent('topbar-container', 'components/topbar.html');

    // 2. Nạp dữ liệu User lên Sidebar (Gọi hàm từ profile.js)
    if (typeof loadUserProfile === "function") {
        loadUserProfile();
    }
    
    // 3. (Tùy chọn) Highlight menu đang được chọn dựa trên URL hiện tại
    highlightCurrentMenu();
}

// Hàm làm sáng nút menu tương ứng với trang đang đứng
function highlightCurrentMenu() {
    const currentPath = window.location.pathname.split('/').pop(); // Lấy tên file, vd: 'books.html'
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(btn => {
        // Tạm đổi thuộc tính data-page trong html thành href (vd: href="books.html")
        if (btn.getAttribute('href') === currentPath) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}