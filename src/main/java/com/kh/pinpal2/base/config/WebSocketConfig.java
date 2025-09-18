package com.kh.pinpal2.base.config;


import com.kh.pinpal2.base.filter.JwtAuthenticationChannelInterceptor;
import com.kh.pinpal2.base.handler.ScoreboardInterceptor;
import com.kh.pinpal2.base.handler.WebSocketHandler;
import com.kh.pinpal2.user.entity.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.security.messaging.access.intercept.AuthorizationChannelInterceptor;
import org.springframework.security.messaging.access.intercept.MessageMatcherDelegatingAuthorizationManager;
import org.springframework.security.messaging.context.SecurityContextChannelInterceptor;
import org.springframework.web.socket.config.annotation.EnableWebSocket;

import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtAuthenticationChannelInterceptor jwtAuthenticationChannelInterceptor;
    private final ScoreboardInterceptor scoreboardInterceptor;

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(
                jwtAuthenticationChannelInterceptor,
                new SecurityContextChannelInterceptor(),
                authorizationChannelInterceptor()
        );
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {

        config.setApplicationDestinationPrefixes("/pub");
        config.enableSimpleBroker("/sub");

    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {

        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // 모든 origin 허용 (배포 환경 대응)
                .setAllowedOrigins("http://localhost:3000", "https://pinpal.co.kr")
                .addInterceptors(scoreboardInterceptor)
                .withSockJS()
                .setHeartbeatTime(25000)
                .setDisconnectDelay(7200000); // 2시간 후 연결 해제
    }

    private AuthorizationChannelInterceptor authorizationChannelInterceptor() {
        return new AuthorizationChannelInterceptor(
                MessageMatcherDelegatingAuthorizationManager.builder()
                        .anyMessage().hasRole(Role.USER.name())
                        .build()
        );
    }
}
