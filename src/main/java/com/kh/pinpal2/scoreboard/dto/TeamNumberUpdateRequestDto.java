package com.kh.pinpal2.scoreboard.dto;

import java.util.List;

public record TeamNumberUpdateRequestDto(
        String action,
        Long gameId,
        List<UserTeamUpdateDto> users
) {

}
