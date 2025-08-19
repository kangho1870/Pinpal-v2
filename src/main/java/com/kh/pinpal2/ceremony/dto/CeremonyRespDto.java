package com.kh.pinpal2.ceremony.dto;

import java.time.Instant;

public record CeremonyRespDto(
        Long id,
        String type,
        int grade,
        int rank,
        Instant createdAt
) {
}

