package com.kh.pinpal2.base.handler;

import com.kh.pinpal2.auth.service.CustomOAuth2User;
import com.kh.pinpal2.user.entity.User;
import com.kh.pinpal2.user.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

// OAuth2 인증 서비스 로직이 정상적으로 완료되었을 때 실행할 핸들러
// SimpleUrlAuthenticationSuccessHandler 클래스 확장
// response 처리 담당
@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        // OAuth2UserServiceImpl 클래스에서 넘어오는 정보임
        CustomOAuth2User customOAuth2User = (CustomOAuth2User) authentication.getPrincipal();
        Map<String, Object> attributes = customOAuth2User.getAttributes();
        boolean existed = customOAuth2User.isExisted();

        // 쿼리 파라미터에서 리다이렉트 URI 확인
        String redirectUriParam = request.getParameter("redirect_uri");

        // 앱 스킴인지 확인 (pinpal://로 시작하는 경우)
        if (redirectUriParam != null && redirectUriParam.startsWith("pinpal://")) {
            log.info("앱 스킴 리다이렉트 감지: {}", redirectUriParam);
            handleAppRedirect(response, customOAuth2User, existed, attributes);
        } else {
            // 웹 리다이렉트 (기존 로직)
            handleWebRedirect(request, response, customOAuth2User, existed, attributes);
        }
    }

    // 앱으로 리다이렉트 처리 (웹과 동일한 경로 구조)
    private void handleAppRedirect(HttpServletResponse response, CustomOAuth2User customOAuth2User, boolean existed, Map<String, Object> attributes) throws IOException {
        if (existed) {
            // 기존 회원 처리
            User user = userRepository.findByEmail(customOAuth2User.getName()).orElse(null);
            if (user != null) {
                user.updateProfile((String) attributes.get("profileImageUrl"));
                userRepository.save(user);
                String accessToken = (String) attributes.get("accessToken");

                if (accessToken != null && !accessToken.isEmpty()) {
                    try {
                        // 웹과 동일한 경로 구조로 앱 스킴 사용
                        String encodedUserName = URLEncoder.encode(user.getName(), StandardCharsets.UTF_8.toString());
                        String encodedUserEmail = URLEncoder.encode(user.getEmail(), StandardCharsets.UTF_8.toString());
                        String encodedProfileImageUrl = "";
                        if (attributes.get("profileImageUrl") != null) {
                            encodedProfileImageUrl = URLEncoder.encode((String) attributes.get("profileImageUrl"), StandardCharsets.UTF_8.toString());
                        }

                        String userInfo = String.format("&userId=%s&userName=%s&userEmail=%s&profileImageUrl=%s&role=%s",
                                user.getId(),
                                encodedUserName,
                                encodedUserEmail,
                                encodedProfileImageUrl,
                                user.getRole().name()
                        );

                        // 웹과 동일한 경로: /sns-success
                        String appRedirectUri = "pinpal://sns-success?access_token=" + accessToken + "&expiration=14400" + userInfo;
                        log.info("기존 회원 앱 리다이렉트: {}", appRedirectUri);
                        response.sendRedirect(appRedirectUri);
                    } catch (Exception e) {
                        log.error("앱 리다이렉트 URL 생성 중 오류: {}", e.getMessage());
                        // 에러 시 기본 앱 스킴으로 리다이렉트
                        String fallbackUri = "pinpal://sns-success?access_token=" + accessToken + "&expiration=14400";
                        response.sendRedirect(fallbackUri);
                    }
                } else {
                    log.error("액세스 토큰이 없습니다.");
                    response.sendRedirect("pinpal://error?message=token_missing");
                }
            } else {
                log.error("사용자를 찾을 수 없습니다.");
                response.sendRedirect("pinpal://error?message=user_not_found");
            }
        } else {
            // 신규 회원 처리
            String snsId = (String) attributes.get("snsId");
            String joinPath = (String) attributes.get("joinPath");
            String profileImageUrl = (String) attributes.get("profileImageUrl");
            String accountEmail = (String) attributes.get("accountEmail");

            if (snsId != null && joinPath != null && accountEmail != null) {
                try {
                    // 웹과 동일한 경로: /auth
                    String appRedirectUri = String.format("pinpal://auth?snsId=%s&joinPath=%s&accountEmail=%s&profileImageUrl=%s",
                            URLEncoder.encode(snsId, StandardCharsets.UTF_8.toString()),
                            URLEncoder.encode(joinPath, StandardCharsets.UTF_8.toString()),
                            URLEncoder.encode(accountEmail, StandardCharsets.UTF_8.toString()),
                            profileImageUrl != null ? URLEncoder.encode(profileImageUrl, StandardCharsets.UTF_8.toString()) : ""
                    );

                    log.info("신규 회원 앱 리다이렉트: {}", appRedirectUri);
                    response.sendRedirect(appRedirectUri);
                } catch (Exception e) {
                    log.error("신규 회원 앱 리다이렉트 URL 생성 중 오류: {}", e.getMessage());
                    response.sendRedirect("pinpal://error?message=encoding_failed");
                }
            } else {
                log.error("필수 파라미터가 없습니다. snsId: {}, joinPath: {}, accountEmail: {}", snsId, joinPath, accountEmail);
                response.sendRedirect("pinpal://error?message=missing_parameters");
            }
        }
    }

    // 웹으로 리다이렉트 처리 (기존 로직)
    private void handleWebRedirect(HttpServletRequest request, HttpServletResponse response, CustomOAuth2User customOAuth2User, boolean existed, Map<String, Object> attributes) throws IOException {
        String clientHost;
        String protocol;

        // 쿼리 파라미터에서 리다이렉트 URI 확인
        String redirectUriParam = request.getParameter("redirect_uri");

        if (redirectUriParam != null && !redirectUriParam.isEmpty()) {
            try {
                java.net.URL url = new java.net.URL(redirectUriParam);
                clientHost = url.getHost() + (url.getPort() != -1 ? ":" + url.getPort() : "");
                protocol = url.getProtocol();
                log.info("쿼리 파라미터에서 리다이렉트 URI 사용: {}://{}", protocol, clientHost);
            } catch (Exception e) {
                log.warn("쿼리 파라미터 리다이렉트 URI 파싱 실패: {}", e.getMessage());
                clientHost = getClientHost(request);
                protocol = getProtocol(request);
            }
        } else {
            // 기존 방식으로 클라이언트 호스트 가져오기
            clientHost = getClientHost(request);
            protocol = getProtocol(request);
        }

        String redirectUri = protocol + "://" + clientHost;
        log.info("웹 리다이렉트 - ClientHost: {}, Protocol: {}, RedirectUri: {}", clientHost, protocol, redirectUri);

        // 회원가입이 되어있을경우
        if (existed) {
            User user = userRepository.findById(customOAuth2User.getDto().id()).orElse(null);
            if (user.getProfile().equals((String) attributes.get("profileImageUrl"))) {
                user.updateProfile((String) attributes.get("profileImageUrl"));
                userRepository.save(user);
            }
            String accessToken = (String) attributes.get("accessToken");

            // 토큰이 있는 경우에만 리다이렉트
            if (accessToken != null && !accessToken.isEmpty()) {
                try {
                    // 사용자 정보를 URL 인코딩하여 전달
                    String encodedUserName = URLEncoder.encode(user.getName(), StandardCharsets.UTF_8.toString());
                    String encodedUserEmail = URLEncoder.encode(user.getEmail(), StandardCharsets.UTF_8.toString());
                    String encodedProfileImageUrl = "";
                    if (attributes.get("profileImageUrl") != null) {
                        encodedProfileImageUrl = URLEncoder.encode((String) attributes.get("profileImageUrl"), StandardCharsets.UTF_8.toString());
                    }

                    String userInfo = String.format("&userId=%s&userName=%s&userEmail=%s&profileImageUrl=%s&role=%s",
                            user.getId(),
                            encodedUserName,
                            encodedUserEmail,
                            encodedProfileImageUrl,
                            user.getRole().name()
                    );

                    String finalRedirectUri = redirectUri + "/sns-success?access_token=" + accessToken + "&expiration=14400" + userInfo;
                    log.info("기존 회원 웹 리다이렉트: {}", finalRedirectUri);
                    response.sendRedirect(finalRedirectUri);
                } catch (Exception e) {
                    log.error("URL 인코딩 중 오류: {}", e.getMessage());
                    // 인코딩 실패 시 기본 리다이렉트
                    String fallbackRedirectUri = redirectUri + "/sns-success?access_token=" + accessToken + "&expiration=14400";
                    response.sendRedirect(fallbackRedirectUri);
                }
            } else {
                log.error("액세스 토큰이 없습니다.");
                response.sendRedirect(redirectUri + "/error?message=token_missing");
            }
        } else {
            String snsId = (String) attributes.get("snsId");
            String joinPath = (String) attributes.get("joinPath");
            String profileImageUrl = (String) attributes.get("profileImageUrl");
            String accountEmail = (String) attributes.get("accountEmail");

            // 필수 파라미터 검증
            if (snsId != null && joinPath != null && accountEmail != null) {
                String finalRedirectUri = redirectUri + "/auth?snsId=" + snsId + "&joinPath=" + joinPath + "&accountEmail=" + accountEmail + "&profileImageUrl=" + profileImageUrl;
                log.info("신규 회원 웹 리다이렉트: {}", finalRedirectUri);
                response.sendRedirect(finalRedirectUri);
            } else {
                log.error("필수 파라미터가 없습니다. snsId: {}, joinPath: {}, accountEmail: {}", snsId, joinPath, accountEmail);
                response.sendRedirect(redirectUri + "/error?message=missing_parameters");
            }
        }
    }

    private String getClientHost(HttpServletRequest request) {
        // X-Forwarded-Host 헤더 확인
        String clientHost = request.getHeader("X-Forwarded-Host");
        if (clientHost != null && !clientHost.isEmpty()) {
            return clientHost;
        }

        // Host 헤더 확인
        clientHost = request.getHeader("Host");
        if (clientHost != null && !clientHost.isEmpty()) {
            // 로컬 개발 환경 (포트 8000 -> 3000)
            if (clientHost.contains(":8000")) {
                return clientHost.replace(":8000", ":3000");
            }
            // 서버 배포 환경 (포트 80 제거)
            if (clientHost.contains(":80")) {
                return clientHost.replace(":80", "");
            }
            // 포트가 없는 경우 그대로 반환 (프로덕션 환경)
            if (!clientHost.contains(":")) {
                return clientHost;
            }
            return clientHost;
        }

        // Referer 헤더에서 호스트 추출 시도
        String referer = request.getHeader("Referer");
        if (referer != null && referer.startsWith("http")) {
            try {
                java.net.URL url = new java.net.URL(referer);
                String host = url.getHost();
                // 프로덕션 환경에서는 포트 제거
                if (host.equals("pinpal.co.kr")) {
                    return host;
                }
                int port = url.getPort();
                return port != -1 ? host + ":" + port : host;
            } catch (Exception e) {
                log.warn("Referer에서 호스트 추출 실패: {}", e.getMessage());
            }
        }

        // 기본값 설정
        log.warn("클라이언트 호스트를 찾을 수 없어 기본값 사용");
        if (clientHost != null && clientHost.contains("localhost")) {
            return "localhost:3000";
        }
        return "pinpal.co.kr";
    }

    private String getProtocol(HttpServletRequest request) {
        // X-Forwarded-Proto 헤더 확인
        String protocol = request.getHeader("X-Forwarded-Proto");
        if (protocol != null && !protocol.isEmpty()) {
            return protocol;
        }

        // HTTPS 여부 확인
        if (request.isSecure()) {
            return "https";
        }

        // 기본값
        return "http";
    }
}