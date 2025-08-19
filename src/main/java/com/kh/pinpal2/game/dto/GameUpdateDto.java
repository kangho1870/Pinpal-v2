package com.kh.pinpal2.game.dto;

import com.kh.pinpal2.game.entity.GameType;

import java.time.LocalDate;
import java.time.LocalTime;

public record GameUpdateDto(
        Long gameId,
        Long clubId,
        String newName,
        String newConfirmedCode,
        LocalDate newDate,
        LocalTime newTime,
        GameType newType,
        String status,
        boolean scoreCounting
) {
}
