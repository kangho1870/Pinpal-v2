package com.kh.pinpal2.ceremony.repository;

import com.kh.pinpal2.ceremony.entity.Ceremony;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Map;

public interface CeremonyRepository extends JpaRepository<Ceremony,Long> {
    @Modifying
    @Query("DELETE FROM Ceremony c WHERE c.game.id IN :gameIds")
    void deleteByGameIds(@Param("gameIds") List<Long> gameIds);

    @Query("SELECT c.id FROM Ceremony c WHERE c.game.id IN :gameIds")
    List<Long> findIdsByGameIds(@Param("gameIds") List<Long> gameIds);

    @Query(
            value = "SELECT c.type, array_agg(u.name) AS winners " +
                    "FROM ceremony c " +
                    "JOIN ceremony_user cu ON c.id = cu.ceremony_id " +
                    "JOIN tbl_user u ON cu.user_id = u.id " +
                    "WHERE c.game_id = :gameId " +
                    "GROUP BY c.type",
            nativeQuery = true
    )
    List<Object[]> getCeremonySummaryByGameId(@Param("gameId") Long gameId);

    // 디버깅용: ceremony만 조회
    @Query(
            value = "SELECT c.id, c.type, c.game_id FROM ceremony c WHERE c.game_id = :gameId",
            nativeQuery = true
    )
    List<Object[]> getCeremoniesByGameId(@Param("gameId") Long gameId);

    // 디버깅용: 모든 ceremony 조회
    @Query(
            value = "SELECT c.id, c.type, c.game_id FROM ceremony c",
            nativeQuery = true
    )
    List<Object[]> getAllCeremonies();

    // 디버깅용: ceremony_user만 조회
    @Query(
            value = "SELECT cu.id, cu.ceremony_id, cu.user_id FROM ceremony_user cu " +
                    "JOIN ceremony c ON cu.ceremony_id = c.id " +
                    "WHERE c.game_id = :gameId",
            nativeQuery = true
    )
    List<Object[]> getCeremonyUsersByGameId(@Param("gameId") Long gameId);
}
