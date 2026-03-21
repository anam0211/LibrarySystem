package com.library.security;

import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j //Lombok ghi log (thay cho System.out.println)
public class JwtTokenProvider {

    // Lấy giá trị từ application.properties
    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpirationDateInMs;

    // Hàm tạo Secret Key từ chuỗi string base64
    private SecretKey key() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
    }

    // Hàm sinh Token
    public String generateToken(String email) {
        Date currentDate = new Date();
        Date expireDate = new Date(currentDate.getTime() + jwtExpirationDateInMs);

        return Jwts.builder()
                .subject(email)             // Lưu email của user vào token
                .issuedAt(new Date())       // Ngày phát hành
                .expiration(expireDate)     // Ngày hết hạn
                .signWith(key())            // Ký token bằng SecretKey
                .compact();
    }

    // Hàm lấy Email từ Token
    public String getEmailFromJwtToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        
        return claims.getSubject();
    }

    // Hàm kiểm tra Token hợp lệ
    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(key()).build().parseSignedClaims(token);
            return true;
        } catch (MalformedJwtException e) {
            log.error("Token JWT không đúng định dạng: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            log.error("Token JWT đã hết hạn: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.error("Token JWT không được hỗ trợ: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.error("Chuỗi claims của JWT bị trống: {}", e.getMessage());
        }
        return false;
    }
}