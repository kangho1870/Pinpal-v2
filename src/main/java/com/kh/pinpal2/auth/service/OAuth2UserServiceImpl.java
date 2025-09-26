package com.kh.pinpal2.auth.service;

import com.kh.pinpal2.base.provider.JwtProvider;
import com.kh.pinpal2.user.entity.User;
import com.kh.pinpal2.user.mapper.UserMapper;
import com.kh.pinpal2.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
// OAuth2를 통해서 클라이언트 정보를 받은 후 진행할 비즈니스로직을 작성하는 서비스
// 반드시 DefaultOAuth2UserService 클래스를 확장해야 함
@RequiredArgsConstructor
@Slf4j
public class OAuth2UserServiceImpl extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final JwtProvider jwtProvider;
    private final UserMapper userMapper;

    // OAuth2 인증 정보를 받고 실행할 비즈니스 로직 메서드
    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        log.info("OAuth2 loadUser 시작 - Provider: {}", userRequest.getClientRegistration().getClientName());
        
        // 재시도 로직 추가 (속도 제한 고려하여 조정)
        int maxRetries = 3; // 최대 재시도 횟수를 3회로 증가
        int retryCount = 0;
        long retryDelay = 10000; // 초기 대기 시간을 10초로 증가

        while (retryCount <= maxRetries) {
            try {
                OAuth2User result = processOAuth2User(userRequest);
                log.info("OAuth2 loadUser 성공 - Provider: {}", userRequest.getClientRegistration().getClientName());
                return result;
            } catch (OAuth2AuthenticationException e) {
                retryCount++;
                log.warn("OAuth2 인증 실패 (시도 {}/{}): {}", retryCount, maxRetries + 1, e.getMessage());
                
                // 토큰 요청 속도 제한 에러인지 확인
                if (isRateLimitError(e) && retryCount <= maxRetries) {
                    try {
                        log.info("토큰 요청 속도 제한 감지. {}ms 대기 후 재시도...", retryDelay);
                        Thread.sleep(retryDelay);
                        retryDelay *= 2; // 지수 백오프: 10초, 20초, 40초
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        OAuth2Error oauth2Error = new OAuth2Error("interrupted", "재시도 중 인터럽트 발생", null);
                        throw new OAuth2AuthenticationException(oauth2Error, e);
                    }
                } else {
                    // 최대 재시도 횟수 초과 또는 다른 에러
                    log.error("OAuth2 인증 최종 실패: {}", e.getMessage());
                    throw e;
                }
            }
        }
        
        OAuth2Error oauth2Error = new OAuth2Error("max_retries_exceeded", "최대 재시도 횟수 초과. 잠시 후 다시 시도해주세요.", null);
        throw new OAuth2AuthenticationException(oauth2Error);
    }

    private OAuth2User processOAuth2User(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        try {
            log.info("OAuth2 processOAuth2User 시작 - Provider: {}", userRequest.getClientRegistration().getClientName());
            
            // 부모 클래스가 가지고있는 loadUser메소드를 사용함
            OAuth2User oAuth2User = super.loadUser(userRequest);
            // 어떤 인증서버인지 그 인증서버의 이름을 반환
            String registration = userRequest.getClientRegistration().getClientName().toLowerCase();

            log.info("OAuth2 사용자 정보 로드 성공 - Provider: {}", registration);
            log.info("OAuth2 사용자 속성: {}", oAuth2User.getAttributes());

        String snsId = getAttributes(oAuth2User, registration).get("snsId");
        String profileImageUrl = getAttributes(oAuth2User, registration).get("profileImageUrl");

        User user = userRepository.findBySnsIdAndJoinPath(snsId, registration).orElse(null);

        CustomOAuth2User customOAuth2User = null;

        if(user == null) {
            log.info("신규 사용자 - SNS ID: {}, Provider: {}", snsId, registration);
            
            // 카카오에서 이메일 정보 가져오기
            String accountEmail = null;
            if(registration.equals("kakao")) {
                Map<String, Object> kakaoAccount = (Map<String, Object>) oAuth2User.getAttributes().get("kakao_account");
                if (kakaoAccount != null) {
                    accountEmail = (String) kakaoAccount.get("email");
                }
            }
            
            Map<String, Object> attributes = new HashMap<>();
            attributes.put("snsId", snsId);
            attributes.put("joinPath", registration);
            attributes.put("profileImageUrl", profileImageUrl);
            attributes.put("accountEmail", accountEmail);
            attributes.put("role", "USER"); // 신규 사용자는 기본적으로 USER 역할
            customOAuth2User = new CustomOAuth2User(null, attributes, false);
        } else {
            log.info("기존 사용자 - SNS ID: {}, Provider: {}", snsId, registration);
            String memberId = user.getEmail();
            String token = jwtProvider.create(memberId);

            Map<String, Object> attributes = new HashMap<>();
            attributes.put("accessToken", token);
            attributes.put("profileImageUrl", profileImageUrl);
            attributes.put("role", user.getRole().name()); // 기존 사용자의 역할 추가
            customOAuth2User = new CustomOAuth2User(userMapper.toDto(user), attributes, true);
        }

        return customOAuth2User;
        } catch (Exception e) {
            log.error("OAuth2 processOAuth2User 실패 - Provider: {}, Error: {}", userRequest.getClientRegistration().getClientName(), e.getMessage(), e);
            throw new OAuth2AuthenticationException(new OAuth2Error("process_failed", "OAuth2 처리 실패: " + e.getMessage(), null), e);
        }
    }

    private boolean isRateLimitError(OAuth2AuthenticationException e) {
        String errorMessage = e.getMessage();
        log.info("OAuth2 에러 메시지 확인: {}", errorMessage);
        return errorMessage != null && (
            errorMessage.contains("KOE237") || 
            errorMessage.contains("rate limit") || 
            errorMessage.contains("429") ||
            errorMessage.contains("too many requests") ||
            errorMessage.contains("token request rate limit exceeded")
        );
    }

    private Map<String, String> getAttributes(OAuth2User oAuth2User, String registration) {
        Map<String, String> attributes = new HashMap<>();
        String snsId = null;
        String profileImageUrl = null;
        
        try {
            if(registration.equals("kakao")) {
                Map<String, Object> kakaoAccount = (Map<String, Object>) oAuth2User.getAttributes().get("kakao_account");
                if (kakaoAccount != null) {
                    Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
                    if (profile != null) {
                        profileImageUrl = (String) profile.get("profile_image_url");
                    }
                }

                attributes.put("profileImageUrl", profileImageUrl);
                snsId = oAuth2User.getName();
                attributes.put("snsId", snsId);
                
                log.debug("카카오 사용자 정보 추출 - SNS ID: {}, Profile URL: {}", snsId, profileImageUrl);
            }
        } catch (Exception e) {
            log.error("OAuth2 사용자 정보 추출 중 오류 - Provider: {}, Error: {}", registration, e.getMessage());
            OAuth2Error oauth2Error = new OAuth2Error("user_info_extraction_failed", "사용자 정보 추출 실패", null);
            throw new OAuth2AuthenticationException(oauth2Error, e);
        }

        return attributes;
    }
}
