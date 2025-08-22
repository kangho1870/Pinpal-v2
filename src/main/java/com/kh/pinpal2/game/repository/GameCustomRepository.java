package com.kh.pinpal2.game.repository;

import com.kh.pinpal2.game.entity.Game;
import com.querydsl.core.Tuple;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Date;
import java.util.List;

public interface GameCustomRepository {
    List<Tuple> findAllByClubId(Long clubId, Instant cursor, int size);
    long countByClubIdAndCursor(Long clubId, Instant cursor);
    List<Game> findAllByClubIdAndFilter(Long clubId, LocalDate startDate, LocalDate endDate, String type);
}
