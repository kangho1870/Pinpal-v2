package com.kh.pinpal2.scoreboard.dto;

public record CardSelectRequestDto(
        Long gameId,
        Long userId,
        Integer grade,
        Integer cardIndex,
        Integer teamNumber
) {
}
