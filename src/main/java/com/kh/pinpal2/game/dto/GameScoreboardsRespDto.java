package com.kh.pinpal2.game.dto;

import com.kh.pinpal2.scoreboard.dto.ScoreboardRespDto;

import java.util.List;

public record GameScoreboardsRespDto(
        GameRespDto game,
        List<ScoreboardRespDto>  scoreboards
) {
}
