package com.kh.pinpal2.scoreboard.repository;

import com.kh.pinpal2.scoreboard.dto.ScoreboardMemberRow;

import java.util.List;

public interface ScoreboardCustomRepository {
    long countByGameId(Long gameId);
    List<ScoreboardMemberRow> findAllWithMemberMetaByGameId(Long gameId);
}
