package com.kh.pinpal2.base.event;

public record ScoreboardAvgUpdate(
    Long gameId,
    Long userId,
    Integer memberAvg
) {
}
