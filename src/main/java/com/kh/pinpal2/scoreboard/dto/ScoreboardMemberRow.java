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
        int game1,
        int game2,
        int game3,
        int game4,
        int grade,
        boolean confirmedJoin,
        boolean sideAvg,
        boolean side,
        int teamNumber,
        ClubRole memberRole,
        Integer memberAvg
) {
}
