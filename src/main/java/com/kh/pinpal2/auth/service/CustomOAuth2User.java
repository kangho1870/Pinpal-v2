package com.kh.pinpal2.auth.service;

import com.kh.pinpal2.user.entity.Role;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.List;
import java.util.Map;

// OAuth2 인증 성공시 인증 서버로부터 클라이언트의 정보를 받아 저장할 객체
// 반드시 OAuth2User interface를 구현해야함
@Getter
public class CustomOAuth2User implements OAuth2User {

    private String name;
    private Map<String, Object> attributes;
    private Collection<? extends GrantedAuthority> authorities;
    private boolean existed;

    public CustomOAuth2User(String name, Map<String, Object> attributes, boolean existed) {
        this.name = name;
        this.attributes = attributes;
        
        // role이 null이면 기본값 "USER" 사용
        String role = attributes.get("role") != null ? attributes.get("role").toString() : Role.USER.name();
        this.authorities = List.of(new SimpleGrantedAuthority(role));
        this.existed = existed;
    }

    @Override
    public Map<String, Object> getAttributes() {
        return this.attributes;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return this.authorities;
    }

    @Override
    public String getName() {
        return this.name;
    }

}
