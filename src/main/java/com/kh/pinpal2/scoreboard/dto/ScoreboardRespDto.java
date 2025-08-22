package com.kh.pinpal2.scoreboard.dto;

public record ScoreboardRespDto(
        Long memberId,
        int score1,
        int score2,
        int score3,
        int score4,
        int grade,
        int avg
) {
}
