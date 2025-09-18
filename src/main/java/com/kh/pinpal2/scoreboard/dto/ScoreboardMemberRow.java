package com.kh.pinpal2.scoreboard.dto;

import com.kh.pinpal2.user_club.entity.ClubRole;

public record ScoreboardMemberRow(
        Long scoreboardId,
        Long memberId,
        String memberName,
        String memberProfile,
        Long gameId,
        String gameName,
        boolean scoreCounting,
        boolean cardDrow,
        Integer game1,
        Integer game2,
        Integer game3,
        Integer game4,
        Integer grade,
        boolean confirmedJoin,
        boolean sideAvg,
        boolean side,
        Integer teamNumber,
        ClubRole memberRole,
        Integer memberAvg,
        Integer gender
) {
}
