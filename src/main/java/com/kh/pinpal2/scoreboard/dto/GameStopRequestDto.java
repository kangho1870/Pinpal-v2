package com.kh.pinpal2.scoreboard.dto;

import java.util.List;

public record GameStopRequestDto(
    Long gameId,
    Long clubId,
    Long pin1st,
    Long avgTopScoreMember,
    Long grade1st,
    Long grade2st,
    Long grade3st,
    Long grade4st,
    Long grade5st,
    Long grade6st,
    Long highScoreOfMan,
    Long highScoreOfGirl,
    List<Long> team1stIds
) {
}
