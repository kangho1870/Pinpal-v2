package com.kh.pinpal2.scoreboard.dto;

public record ConfirmCheckRequestDto(
        String action,
        Long gameId,
        Long userId,
        String code
) {

}
