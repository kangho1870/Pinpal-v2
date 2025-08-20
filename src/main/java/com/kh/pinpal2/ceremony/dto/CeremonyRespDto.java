package com.kh.pinpal2.ceremony.dto;

import com.kh.pinpal2.ceremony_user.dto.CeremonyUserRespDto;
import java.time.Instant;
import java.util.List;

public record CeremonyRespDto(
        String type,
        List<String> winners
) {
}

