package com.kh.pinpal2.game.controller;

import com.kh.pinpal2.base.dto.PageResponse;
import com.kh.pinpal2.game.dto.GameCreateDto;
import com.kh.pinpal2.game.dto.GameRespDto;
import com.kh.pinpal2.game.dto.GameUpdateDto;
import com.kh.pinpal2.game.dto.GameParticipantDto;
import com.kh.pinpal2.game.service.GameService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/games")
public class GameController {

    private final GameService gameService;

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
    public ResponseEntity<Void> deleteGame(@RequestParam Long gameId) {
        gameService.deleteGame(gameId);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @PostMapping("/{gameId}/scoreboards")
    public ResponseEntity<GameRespDto> joinGame(@PathVariable Long gameId) {
        GameRespDto response = gameService.joinGame(gameId);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @DeleteMapping("/{gameId}/scoreboards")
    public ResponseEntity<GameRespDto> joinCancelGame(@PathVariable Long gameId) {
        GameRespDto response = gameService.joinCancelGame(gameId);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @GetMapping("/{gameId}/participants")
    public ResponseEntity<List<GameParticipantDto>> getGameParticipants(@PathVariable Long gameId) {
        List<GameParticipantDto> response = gameService.getGameParticipants(gameId);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }
}
