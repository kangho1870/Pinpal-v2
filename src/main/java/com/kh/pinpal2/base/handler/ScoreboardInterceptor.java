package com.kh.pinpal2.base.handler;

import com.kh.pinpal2.base.provider.JwtProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class ScoreboardInterceptor implements HandshakeInterceptor {
    private final JwtProvider jwtProvider;
    
    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {

        String path = request.getURI().getPath();
        String scoreboardId = path.substring(path.lastIndexOf("/") + 1);
        attributes.put("scoreboardId", scoreboardId);
        
        // JWT 토큰 검증
        String query = request.getURI().getQuery();
        if (query != null && query.contains("token=")) {
            String token = query.substring(query.indexOf("token=") + 6);
            if (token.contains("&")) {
                token = token.substring(0, token.indexOf("&"));
            }
            
            try {
                if (jwtProvider.validate(token) != null) {
                    attributes.put("authenticated", true);
                    attributes.put("token", token);
                    return true;
                }
            } catch (Exception e) {
                System.out.println("JWT 토큰 검증 실패: " + e.getMessage());
            }
        }
        
        // 토큰이 없거나 유효하지 않은 경우에도 연결 허용 (개발 환경)
        attributes.put("authenticated", false);
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Exception exception) {
        // 핸드셰이크 후 처리
    }
}
