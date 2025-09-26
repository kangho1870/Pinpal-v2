package com.kh.pinpal2.game.service;

import com.kh.pinpal2.base.dto.PageResponse;
import com.kh.pinpal2.game.dto.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public interface GameService {
    PageResponse<GameRespDto> findAllByClubId(Long clubId, Instant cursor);

    GameRespDto registerGame(GameCreateDto gameCreateDto);

    GameRespDto updateGame(GameUpdateDto gameUpdateDto);

    void deleteGame(Long gameId, Long clubId);

    GameRespDto joinGame(Long gameId, Long clubId);

    GameRespDto joinCancelGame(Long gameId, Long clubId);

    List<GameParticipantDto> getGameParticipants(Long gameId);

    List<GameScoreboardsRespDto> getScoreboardByClubId(Long clubId, LocalDate startDate, LocalDate endDate, String type);
}
