package com.library.security;

import java.io.IOException;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final CustomUserDetailsService customUserDetailsService;

    // Tiêm các component đã tạo ở bước trước vào đây
    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider, CustomUserDetailsService customUserDetailsService) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.customUserDetailsService = customUserDetailsService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        try {
            // 1. Lấy JWT từ Header của HTTP Request
            String jwt = getJwtFromRequest(request);

            // 2. Kiểm tra xem JWT có tồn tại và có hợp lệ không
            if (StringUtils.hasText(jwt) && jwtTokenProvider.validateToken(jwt)) {
                
                // Lấy email (subject) từ token
                String email = jwtTokenProvider.getEmailFromJwtToken(jwt);

                // Tải thông tin người dùng từ Database lên
                UserDetails userDetails = customUserDetailsService.loadUserByUsername(email);

                // Tạo đối tượng Authentication hợp lệ cho Spring Security
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                
                // Lưu thêm thông tin về request (ví dụ: IP address)
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // 3. Đưa thông tin vào Security Context (Báo cho hệ thống biết "Người này đã đăng nhập hợp lệ")
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (org.springframework.security.core.userdetails.UsernameNotFoundException | IllegalArgumentException ex) {
            logger.error("Không thể thiết lập xác thực người dùng trong Security Context", ex);
        }

        // 4. Cho phép Request đi tiếp tới màng lọc tiếp theo hoặc tới Controller
        filterChain.doFilter(request, response);
    }

    // Hàm phụ trợ: Trích xuất token từ Header
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        // Token chuẩn thường có dạng "Bearer eyJhbGciOiJIUzI1NiJ9..."
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7); // Cắt bỏ 7 ký tự "Bearer " để lấy đúng chuỗi mã hóa
        }
        return null;
    }
}