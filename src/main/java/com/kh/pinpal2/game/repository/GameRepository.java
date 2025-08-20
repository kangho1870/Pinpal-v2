package com.kh.pinpal2.game.repository;

import com.kh.pinpal2.game.entity.Game;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GameRepository extends JpaRepository<Game,Long>, GameCustomRepository {
    @Modifying
    @Query("DELETE FROM Game g WHERE g.club.id = :clubId")
    void deleteByClubId(@Param("clubId") Long clubId);

    @Query("SELECT g.id FROM Game g WHERE g.club.id = :clubId")
    List<Long> findIdsByClubId(@Param("clubId") Long clubId);

    List<Game> findByClubId(Long clubId, Limit limit);
    
    // 최근 게임 조회 (ID 내림차순 정렬)
    @Query("SELECT g FROM Game g WHERE g.club.id = :clubId ORDER BY g.id DESC")
    List<Game> findRecentGamesByClubId(@Param("clubId") Long clubId, Limit limit);
}
