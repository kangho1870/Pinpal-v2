package com.kh.pinpal2.game.controller;

import com.kh.pinpal2.base.dto.PageResponse;
import com.kh.pinpal2.base.service.ExcelExportService;
import com.kh.pinpal2.game.dto.*;
import com.kh.pinpal2.game.service.GameService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/games")
public class GameController {

    private final GameService gameService;
    private final ExcelExportService excelExportService;

    @GetMapping
    public ResponseEntity<PageResponse<GameRespDto>> findAllByClubId(
            @RequestParam Long clubId, 
            @RequestParam(required = false) Instant cursor) {
        PageResponse<GameRespDto> response = gameService.findAllByClubId(clubId, cursor);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @PostMapping
    public ResponseEntity<GameRespDto> registerGame(@RequestBody GameCreateDto gameCreateDto) {
        GameRespDto response = gameService.registerGame(gameCreateDto);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @PatchMapping
    public ResponseEntity<GameRespDto> updateGame(@RequestBody GameUpdateDto gameUpdateDto) {
        GameRespDto response = gameService.updateGame(gameUpdateDto);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteGame(@RequestParam Long gameId, @RequestParam Long clubId) {
        gameService.deleteGame(gameId, clubId);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @GetMapping("/{clubId}/scoreboards")
    public ResponseEntity<List<GameScoreboardsRespDto>> getScoreboardByGameId(@PathVariable Long clubId, LocalDate startDate, LocalDate endDate, String type) {
        List<GameScoreboardsRespDto> response = gameService.getScoreboardByClubId(clubId, startDate, endDate, type);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @PostMapping("/{gameId}/scoreboards")
    public ResponseEntity<GameRespDto> joinGame(@PathVariable Long gameId, @RequestParam Long clubId) {
        GameRespDto response = gameService.joinGame(gameId, clubId);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @DeleteMapping("/{gameId}/scoreboards")
    public ResponseEntity<GameRespDto> joinCancelGame(@PathVariable Long gameId, @RequestParam Long clubId) {
        GameRespDto response = gameService.joinCancelGame(gameId, clubId);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @GetMapping("/{gameId}/export/scoreboards")
    public ResponseEntity<byte[]> exportScoreboards(@PathVariable Long gameId) {
        byte[] response = excelExportService.exportScoreboardToExcel(gameId);

        return ResponseEntity.status(HttpStatus.OK)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=scoreboard.xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(response);
    }
}
