package com.kh.pinpal2.ceremony.controller;

import com.kh.pinpal2.ceremony.dto.CeremonyRespDto;
import com.kh.pinpal2.ceremony.service.CeremonyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/ceremonies")
public class CeremonyController {

    private final CeremonyService ceremonyService;

    @GetMapping("/club/{clubId}")
    public ResponseEntity<List<CeremonyRespDto>> getCeremoniesByClubId(@PathVariable Long clubId) {
        List<CeremonyRespDto> response = ceremonyService.getCeremoniesByClubId(clubId);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }
}

