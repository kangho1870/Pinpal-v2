package com.kh.pinpal2.club.repository;

import com.kh.pinpal2.club.entity.Club;

import java.time.Instant;
import java.util.List;

public interface ClubCustomRepository {

    List<Club> getAllClubs(Instant cursor, int size);
    long countByCursor(Instant cursor);
    List<Club> getAllClubsByPage(int offset, int pageSize);
}
