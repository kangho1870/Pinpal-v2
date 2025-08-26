package com.kh.pinpal2.user_club.dto;

import com.kh.pinpal2.user_club.entity.ClubRole;

public record UserClubRoleUpdateReqDto(
        Long memberId,
        ClubRole role
) {
}
