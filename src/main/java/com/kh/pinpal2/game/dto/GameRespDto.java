package com.kh.pinpal2.game.dto;

import com.kh.pinpal2.game.entity.GameType;

import java.time.LocalDate;
import java.time.LocalTime;

public record GameRespDto(
        Long id,
        String name,
        GameType type,
        boolean scoreCounting,
        LocalDate date,
        LocalTime time,
        String status,
        boolean isDelete,
        long joinUserCount
) {
}
