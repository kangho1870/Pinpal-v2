package com.kh.pinpal2.scoreboard.service;

import com.kh.pinpal2.scoreboard.dto.GameStopRequestDto;

public interface ScoreboardService {
    void stopGame(GameStopRequestDto requestDto);
}
