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
            
            document.getElementById('profileName').innerText = user.fullName;
            document.getElementById('profileEmail').innerText = user.email;
            
            const roleBadge = document.getElementById('profileRole');
            if (roleBadge) {
                if (user.role === 'ADMIN' || user.role === 'ROLE_ADMIN') {
                    roleBadge.innerText = 'Quản trị viên (ADMIN)';
                    roleBadge.className = 'badge bg-danger';
                } else {
                    roleBadge.innerText = 'Độc giả (USER)';
                    roleBadge.className = 'badge bg-success';
                }
            }
        }
    } catch (error) {
        console.error("Lỗi:", error);
    }
});