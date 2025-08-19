package com.kh.pinpal2.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record SignInReqDto(
        @NotBlank
        String email,

        @NotBlank
        String password
) {
}
