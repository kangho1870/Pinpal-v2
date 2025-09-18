package com.kh.pinpal2.base.event;

public record ScoreUpdate(
        Long gameId,
        Long userId,
        int score1,
        int score2,
        int score3,
        int score4
) {
}
