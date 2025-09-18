package com.kh.pinpal2.scoreboard.dto;

public record ScoreboardUpdate(

        String action,
        Long gameId,
        Long userId,
        ScoreUpdateDto score
) {

}
