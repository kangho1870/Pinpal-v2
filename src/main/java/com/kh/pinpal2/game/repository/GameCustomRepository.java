package com.kh.pinpal2.game.repository;

import com.querydsl.core.Tuple;

import java.time.Instant;
import java.util.List;

public interface GameCustomRepository {
    List<Tuple> findAllByClubId(Long clubId, Instant cursor, int size);
    long countByClubIdAndCursor(Long clubId, Instant cursor);
}
