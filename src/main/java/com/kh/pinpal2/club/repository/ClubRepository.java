package com.kh.pinpal2.club.repository;

import com.kh.pinpal2.club.entity.Club;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClubRepository extends JpaRepository<Club,Long>, ClubCustomRepository {
}
