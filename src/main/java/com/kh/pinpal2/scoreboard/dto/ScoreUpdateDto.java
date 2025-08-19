package com.kh.pinpal2.scoreboard.dto;

public record ScoreUpdateDto(
         Long userId,
         Long gameId,
         Integer game1Score,
         Integer game2Score,
         Integer game3Score,
         Integer game4Score
) {

}
