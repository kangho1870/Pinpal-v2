package com.kh.pinpal2.user.dto;

import com.kh.pinpal2.user.entity.Role;

public record UserRespDto(
        Long id,
        String name,
        String profile,
        Role role
) {
}
