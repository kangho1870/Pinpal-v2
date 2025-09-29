package com.kh.pinpal2.scoreboard.dto;

public record AvgUpdateRequestDto(
    String action,
    Long gameId,
    Long userId,
    int avg
) {
}
