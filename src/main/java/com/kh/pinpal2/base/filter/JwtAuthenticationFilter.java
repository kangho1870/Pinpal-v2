package com.kh.pinpal2.base.filter;

// filter :
// - 서버로직과 서블릿(컨트롤러, 서비스, 리포지토리가 있는 곳) 사이에서 http request에 대한 사전 검사 작업을 수행하는 영역
// - filter에서 걸러진 request는 서블릿까지 도달하지 못하고 reject 됨 (거부됨)


import com.kh.pinpal2.base.provider.JwtProvider;
import com.kh.pinpal2.user.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

// OncePerRequestFilter 라는 추상클래스를 확장 구현하여 filter 클래스로 생성
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {

        try {
            // 1. request 객체에서 token 가져오기
            String token = parseBearerToken(request);
            if(token == null || token.trim().isEmpty()) {
                // 다음 필터로 넘어가라는 것
                filterChain.doFilter(request, response);
                return;
            }

            // 2. token 검증
            String subject = jwtProvider.validate(token);
            if(subject == null) {
                filterChain.doFilter(request, response);
                return;
            }

            // 3. 만료된 토큰인 경우
            if ("JWT Expired".equals(subject)) {
                filterChain.doFilter(request, response);
                return;
            }

            setContext(request, subject);

        } catch (Exception e) {
            // 예외 발생 시 로그만 남기고 다음 필터로 진행
            System.err.println("JWT 필터 처리 중 예외 발생: " + e.getMessage());
        }

        // 6. 다음 필터에 request와 response를 전달
        filterChain.doFilter(request, response);
    }

    // Authorization 의 값이 Bearer 토큰인지 확인해야 함
    private String parseBearerToken(HttpServletRequest request) {
        String authorization = request.getHeader("Authorization");

        // Authorization 필드값의 존재 여부 확인
        boolean hasAuthorization = StringUtils.hasText(authorization);
        if(!hasAuthorization) return null;

        // 문자열이 Bearer로 시작하는지 판별해 줌
        boolean isBearer = authorization.startsWith("Bearer ");
        if(!isBearer) return null;

        String token = authorization.substring(7);

        return token;
    }

    // security context 생성 및 등록
    private void setContext(HttpServletRequest request, String userId) {

        // 접근 주체에 대한 인증 토큰 생성
        AbstractAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(userId, null, AuthorityUtils.NO_AUTHORITIES);

        // 생성한 인증 토큰이 어떤 요청에 대한 내용인 상세 정보 추가
        authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

        // 빈 security context 생성
        SecurityContext securityContext = SecurityContextHolder.createEmptyContext();

        // security context에 토큰 주입
        securityContext.setAuthentication(authenticationToken);

        // 생성한 security context 등록
        SecurityContextHolder.setContext(securityContext);
    }
}
