package com.kh.pinpal2.scoreboard.dto;

public record SideJoinRequestDto(
        String action,
        Long gameId,
        Long userId,
        String sideType
) {

}
