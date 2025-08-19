package com.kh.pinpal2.scoreboard.repository;

import com.kh.pinpal2.scoreboard.entity.Scoreboard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ScoreboardRepository extends JpaRepository<Scoreboard,Long>, ScoreboardCustomRepository {

    Optional<Scoreboard> findByGameIdAndUserId(Long gameId, Long memberId);

    @Modifying
    @Query("DELETE FROM Scoreboard s WHERE s.game.id IN :gameIds")
    void deleteByGameIds(@Param("gameIds") List<Long> gameIds);

    boolean existsByGameIdAndUserId(Long gameId, Long id);

    List<Scoreboard> findAllByGameId(Long gameId);
}
