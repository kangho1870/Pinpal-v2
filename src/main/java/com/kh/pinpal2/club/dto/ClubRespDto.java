package com.kh.pinpal2.club.dto;

import com.kh.pinpal2.user.dto.UserRespDto;

public record ClubRespDto(
        Long id,
        String name,
        String description,
        UserRespDto owner
) {
}
