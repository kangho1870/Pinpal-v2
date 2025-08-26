package com.kh.pinpal2.user_club.dto;

import java.util.List;

public record UserClubAvgUpdateReqDto(
        List<Long> ids,
        List<Integer> averages,
        List<Integer> grades
) {
}
