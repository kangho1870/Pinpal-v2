package com.kh.pinpal2.base.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.concurrent.TimeUnit;

@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        SimpleCacheManager cacheManager = new SimpleCacheManager();

        CaffeineCache clubs = new CaffeineCache("clubs",
            Caffeine.newBuilder()
                .expireAfterAccess(172800, TimeUnit.SECONDS) // 클럽 목록: 2일
                .maximumSize(1000)
                .recordStats()
                .build());

        CaffeineCache games = new CaffeineCache("games",
            Caffeine.newBuilder()
                .expireAfterAccess(172800, TimeUnit.SECONDS) // 클럽별 게임 목록: 2일
                .maximumSize(1000)
                .recordStats()
                .build());

        CaffeineCache users = new CaffeineCache("users",
            Caffeine.newBuilder()
                .expireAfterAccess(86400, TimeUnit.SECONDS) // 클럽별 유저 목록: 1일
                .maximumSize(1000)
                .recordStats()
                .build());

        CaffeineCache ceremonies = new CaffeineCache("ceremonies",
            Caffeine.newBuilder()
                .expireAfterAccess(172800, TimeUnit.SECONDS) // 클럽별 게임 시상: 2일
                .maximumSize(1000)
                .recordStats()
                .build());

        CaffeineCache recentCeremonies = new CaffeineCache("recentCeremonies",
            Caffeine.newBuilder()
                .expireAfterAccess(172800, TimeUnit.SECONDS) // 클럽별 최근 게임 시상: 2일
                .maximumSize(1000)
                .recordStats()
                .build());

        CaffeineCache scoreboards = new CaffeineCache("scoreboards",
            Caffeine.newBuilder()
                .expireAfterAccess(172800, TimeUnit.SECONDS) // 클럽별 최근 게임 스코어보드: 2일
                .maximumSize(1000)
                .recordStats()
                .build());

        cacheManager.setCaches(Arrays.asList(
            clubs, games, users, ceremonies, recentCeremonies, scoreboards
        ));

        return cacheManager;
    }
}
