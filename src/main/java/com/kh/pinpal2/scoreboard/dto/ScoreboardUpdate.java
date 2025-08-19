package com.kh.pinpal2.scoreboard.dto;

public record ScoreboardUpdate(

        String action,
        Object gameId,
        Long userId,
        ScoreUpdateDto score
) {

}
