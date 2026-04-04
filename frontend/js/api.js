const API_BASE_URL = 'http://localhost:8080/api';

/**
 * @param {string} endpoint '/auth/login', '/users/me'
 * @param {object} options Method, body, headers...
 */
async function fetchAPI(endpoint, options = {}) {
    const url = API_BASE_URL + endpoint;
    
    const token = sessionStorage.getItem('token');
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers: headers
    };

    try {
        const response = await fetch(url, config);
        
        if (response.status === 401 && !endpoint.includes('/auth/login')) {
            console.warn("Token hết hạn hoặc không hợp lệ. Đang đá văng ra ngoài...");
            sessionStorage.removeItem('token');
            window.location.href = 'login?error=session_expired';
            return null; 
        }
        
        return response;
    } catch (error) {
        console.error(`Lỗi khi gọi API [${endpoint}]:`, error);
        throw error; 
    }
}