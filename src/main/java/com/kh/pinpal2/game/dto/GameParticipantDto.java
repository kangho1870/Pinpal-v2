package com.kh.pinpal2.game.dto;

public record GameParticipantDto(
        Long userId,
        String userName,
        String userProfile,
        String role
) {
}

