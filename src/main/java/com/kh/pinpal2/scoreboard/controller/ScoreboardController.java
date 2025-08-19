package com.kh.pinpal2.scoreboard.controller;

import com.kh.pinpal2.scoreboard.service.ScoreboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/scoreboards")
public class ScoreboardController {

    private final ScoreboardService scoreboardService;


}
