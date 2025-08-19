package com.kh.pinpal2.base.config;


import com.kh.pinpal2.base.handler.ScoreboardInterceptor;
import com.kh.pinpal2.base.handler.WebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

    private final WebSocketHandler webSocketHandler;
    private final ScoreboardInterceptor scoreboardInterceptor;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(webSocketHandler, "/scoreboard/{scoreboardId}")
                .setAllowedOrigins("*")
                .addInterceptors(scoreboardInterceptor);
    }
}
