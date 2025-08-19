package com.kh.pinpal2.ceremony.repository;

import com.kh.pinpal2.ceremony.entity.Ceremony;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CeremonyRepository extends JpaRepository<Ceremony,Long> {
    @Modifying
    @Query("DELETE FROM Ceremony c WHERE c.game.id IN :gameIds")
    void deleteByGameIds(@Param("gameIds") List<Long> gameIds);

    @Query("SELECT c.id FROM Ceremony c WHERE c.game.id IN :gameIds")
    List<Long> findIdsByGameIds(@Param("gameIds") List<Long> gameIds);
    
    List<Ceremony> findByGameIdInOrderByCreatedAtDesc(List<Long> gameIds);
}
