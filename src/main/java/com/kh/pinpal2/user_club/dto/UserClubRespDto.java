package com.kh.pinpal2.user_club.dto;

import com.kh.pinpal2.club.dto.ClubRespDto;
import com.kh.pinpal2.user.dto.UserRespDto;
import com.kh.pinpal2.user_club.entity.ClubRole;

public record UserClubRespDto(
        int avg,
        int grade,
        UserRespDto user,
        ClubRole role,
        ClubRespDto club
) {
}
