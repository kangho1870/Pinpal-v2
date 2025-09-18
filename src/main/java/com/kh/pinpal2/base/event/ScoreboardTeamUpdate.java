package com.kh.pinpal2.base.event;

import com.kh.pinpal2.scoreboard.dto.UserTeamUpdateDto;

import java.util.List;

public record ScoreboardTeamUpdate(
    Long gameId,
    List<UserTeamUpdateDto> users
) {
}
