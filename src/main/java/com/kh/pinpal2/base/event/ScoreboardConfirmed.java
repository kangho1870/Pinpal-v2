package com.kh.pinpal2.base.event;

public record ScoreboardConfirmed(
        Long gameId,
        Long userId,
        boolean confirmed
) {
}
