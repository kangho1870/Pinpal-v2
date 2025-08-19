package com.kh.pinpal2.game.service;

import com.kh.pinpal2.base.dto.PageResponse;
import com.kh.pinpal2.game.dto.GameCreateDto;
import com.kh.pinpal2.game.dto.GameRespDto;
import com.kh.pinpal2.game.dto.GameUpdateDto;
import com.kh.pinpal2.game.dto.GameParticipantDto;

import java.time.Instant;
import java.util.List;

public interface GameService {
    PageResponse<GameRespDto> findAllByClubId(Long clubId, Instant cursor);

    GameRespDto registerGame(GameCreateDto gameCreateDto);

    GameRespDto updateGame(GameUpdateDto gameUpdateDto);

    void deleteGame(Long gameId);

    GameRespDto joinGame(Long gameId);

    GameRespDto joinCancelGame(Long gameId);

    List<GameParticipantDto> getGameParticipants(Long gameId);
}
