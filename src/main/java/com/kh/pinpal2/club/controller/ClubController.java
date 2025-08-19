package com.kh.pinpal2.club.controller;

import com.kh.pinpal2.base.dto.PageResponse;
import com.kh.pinpal2.club.dto.ClubCreateDto;
import com.kh.pinpal2.club.dto.ClubRespDto;
import com.kh.pinpal2.club.dto.ClubUpdateDto;
import com.kh.pinpal2.club.service.ClubService;
import com.kh.pinpal2.user_club.dto.UserClubRespDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/clubs")
public class ClubController {

    private final ClubService clubService;

    @PostMapping
    public ResponseEntity<ClubRespDto> registerClub(@RequestBody ClubCreateDto clubCreateDto) {
        ClubRespDto response = clubService.register(clubCreateDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PatchMapping("/{clubId}")
    public ResponseEntity<ClubRespDto> updateClub(@PathVariable Long clubId, @RequestBody ClubUpdateDto clubUpdateDto) {
        ClubRespDto response = clubService.updateClub(clubId, clubUpdateDto);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @PostMapping("/{clubId}/members")
    public ResponseEntity<UserClubRespDto> joinClub(@PathVariable Long clubId) {
        UserClubRespDto response = clubService.joinClub(clubId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<PageResponse<ClubRespDto>> getAllClubs(
            @RequestParam(required = false) Instant cursor,
            @RequestParam(required = false, defaultValue = "1") Integer page) {
        PageResponse<ClubRespDto> response = clubService.getAllClubs(cursor, page);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @GetMapping("/{clubId}")
    public ResponseEntity<ClubRespDto> getClubById(@PathVariable Long clubId) {
        ClubRespDto response = clubService.getClubById(clubId);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @GetMapping("/{clubId}/members")
    public ResponseEntity<List<UserClubRespDto>> getClubMembers(@PathVariable Long clubId) {
        List<UserClubRespDto> response = clubService.getClubMembers(clubId);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @DeleteMapping("/{clubId}")
    public ResponseEntity<Void> deleteClub(@PathVariable Long clubId) {
        clubService.delete(clubId);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
