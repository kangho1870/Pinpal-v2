package com.kh.pinpal2.base.event;

import com.kh.pinpal2.scoreboard.dto.UserGradeUpdateDto;

import java.util.List;

public record ScoreboardGradeUpdate(
        Long gameId,
        List<UserGradeUpdateDto> users
) {
}
