package com.kh.pinpal2.game.dto;

import com.kh.pinpal2.game.entity.GameType;

import java.time.LocalDate;
import java.time.LocalTime;

public record GameCreateDto(
         Long clubId,
         String gameName,
         LocalDate date,
         LocalTime time,
         GameType gameType,
         String confirmCode
) {
}
