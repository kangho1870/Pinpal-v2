package com.kh.pinpal2.base.event;

import com.kh.pinpal2.scoreboard.dto.ScoreboardMemberRow;

public record GameParticipantJoinEvent(
        Long gameId,
        ScoreboardMemberRow newParticipant
) {
}




