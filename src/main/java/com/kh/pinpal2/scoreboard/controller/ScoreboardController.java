package com.kh.pinpal2.scoreboard.controller;

import com.kh.pinpal2.scoreboard.dto.GameStopRequestDto;
import com.kh.pinpal2.scoreboard.service.ScoreboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;



@RestController
@RequiredArgsConstructor
@RequestMapping("/api/scoreboard")
public class ScoreboardController {

    private final ScoreboardService scoreboardService;

    @PostMapping("/stop")
    public ResponseEntity<Void> stopGame(@RequestBody GameStopRequestDto requestDto) {
        scoreboardService.stopGame(requestDto);
        return ResponseEntity.status(HttpStatus.OK).build();
    }
}
