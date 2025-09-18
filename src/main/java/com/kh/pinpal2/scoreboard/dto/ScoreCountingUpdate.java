package com.kh.pinpal2.scoreboard.dto;

public record ScoreCountingUpdate(

        String action,
        Long gameId,
        Long userId,
        Boolean scoreCounting
) {
}
