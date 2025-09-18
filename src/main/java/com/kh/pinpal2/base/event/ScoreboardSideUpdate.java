package com.kh.pinpal2.base.event;

public record ScoreboardSideUpdate(
        Long gameId,
        Long userId,
        String sideType,
        boolean joined
) {
}
