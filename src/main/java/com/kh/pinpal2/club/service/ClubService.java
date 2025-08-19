package com.kh.pinpal2.club.service;

import com.kh.pinpal2.base.dto.PageResponse;
import com.kh.pinpal2.club.dto.ClubCreateDto;
import com.kh.pinpal2.club.dto.ClubRespDto;
import com.kh.pinpal2.club.dto.ClubUpdateDto;
import com.kh.pinpal2.user_club.dto.UserClubRespDto;

import java.time.Instant;
import java.util.List;

public interface ClubService {
    ClubRespDto register(ClubCreateDto clubCreateDto);

    ClubRespDto updateClub(Long clubId, ClubUpdateDto clubUpdateDto);
    
    UserClubRespDto joinClub(Long clubId);

    PageResponse<ClubRespDto> getAllClubs(Instant cursor, Integer page);

    ClubRespDto getClubById(Long clubId);

    List<UserClubRespDto> getClubMembers(Long clubId);

    void delete(Long clubId);
}
