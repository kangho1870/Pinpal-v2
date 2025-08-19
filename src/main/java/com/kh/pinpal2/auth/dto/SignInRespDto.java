package com.kh.pinpal2.auth.dto;

public record SignInRespDto(
        String accessToken,
        int expiration
) {
}
