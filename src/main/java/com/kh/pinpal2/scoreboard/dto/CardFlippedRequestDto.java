package com.kh.pinpal2.scoreboard.dto;

public record CardFlippedRequestDto(
        Long gameId,
        String grade,
        String cardId,
        Long userId,
        Integer teamNumber
) {
}


