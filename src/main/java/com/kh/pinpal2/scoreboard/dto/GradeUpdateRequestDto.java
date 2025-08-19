package com.kh.pinpal2.scoreboard.dto;


import java.util.List;

public record GradeUpdateRequestDto (
        String action,
        Long gameId,
        List<UserGradeUpdateDto> users
) {
}
