package com.kh.pinpal2.user_club.repository;

import com.kh.pinpal2.user_club.entity.UserClub;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserClubRepository extends JpaRepository<UserClub,Long> {
    boolean existsByUserIdAndClubId(Long userId, Long clubId);
    @Modifying
    @Query("DELETE FROM UserClub uc WHERE uc.club.id = :clubId")
    void deleteByClubId(@Param("clubId") Long clubId);

    Optional<UserClub> findByClubIdAndUserId(Long clubId, Long userId);
    
    List<UserClub> findByClubId(Long clubId);
    
    // 사용자가 가입한 모든 클럽 조회
    List<UserClub> findByUserId(Long userId);
}
