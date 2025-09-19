package com.kh.pinpal2.scoreboard.dto;

import java.util.Map;

public record CardDrawStartRequestDto(
        Long gameId,
        Integer teamCount,
        Map<String, Object> cardDrawData
) {
}


