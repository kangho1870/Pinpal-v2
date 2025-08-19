package com.kh.pinpal2.base.provider;

// JWT:
// - Json Web Token, RFC7519 표준에 정의된 JSON 형식의 문자열을 포함하는 토큰
// - 인증 및 인가
// - 암호화가 되어 있어 클라이언트와 서버 간에 안전한 데이터 전달을 수행할 수 있음
// - 헤더 : 토큰의 유형, 암호화 알고리즘이 지정되어있음
// - 페이로드 : 클라이언트 혹은 서버가 전달하려는 정보가 포함되어 있음
// - 서명 : 헤더와 페이로드를 합쳐서 인코딩하고 비밀키로 암호화한 데이터

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@Component
public class JwtProvider {

    // 1 방법
    @Value("${jwt.secret}")
    private String secretKey;

    // 2 시스템의 환경변수로 등록하여 사용
    // - OS 자체의 시스템 환경변수에 비밀키를 등록

    public String create(String id) {
        // 1. JWT의 만료일자 및 시간 지정
        Date expiredDate = Date.from(Instant.now().plus(4, ChronoUnit.HOURS));

        String jwt = null;

        try {

            Key key = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));

            jwt = Jwts.builder()
                    .signWith(key, SignatureAlgorithm.HS256)
                    .setSubject(id)
                    .setIssuedAt(new Date())
                    .setExpiration(expiredDate)
                    .compact();

        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }

        return jwt;
    }

    public String validate(String jwt) {

        String userId = null;

        try {
            // JWT 토큰이 null이거나 빈 문자열인 경우
            if (jwt == null || jwt.trim().isEmpty()) {
                return null;
            }

            // JWT 토큰 형식 검증 (최소 2개의 점이 있어야 함)
            if (!jwt.contains(".") || jwt.split("\\.").length != 3) {
                return null;
            }

            // jwt 검증 결과로 반환되는 payload가 저장될 변수
            Claims claims = null;

            // 비밀키 생성
            Key key = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));

            // jwt 검증 및 payload의 subject 값 추출
            userId = Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(jwt)
                    .getBody()
                    .getSubject();
        } catch (ExpiredJwtException e) {
            // 토큰이 만료된 경우
            return "JWT Expired"; // 원하는 리턴 값
        } catch (Exception exception) {
            // JWT 파싱 실패 시 null 반환
            return null;
        }
        return userId;
    }
}
