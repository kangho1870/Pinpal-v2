package com.kh.pinpal2.ceremony_user.dto;

import com.kh.pinpal2.user.dto.UserRespDto;

public record CeremonyUserRespDto(
        Long id,
        UserRespDto user,
        Long ceremonyId
) {
}
