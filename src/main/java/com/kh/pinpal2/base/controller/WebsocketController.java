package com.kh.pinpal2.base.controller;

import com.kh.pinpal2.game.service.GameService;
import com.kh.pinpal2.scoreboard.dto.*;
import com.kh.pinpal2.scoreboard.service.ScoreboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;


@Slf4j
@Controller
@RequiredArgsConstructor
public class WebsocketController {

    private final ScoreboardService scoreboardService;
    private final GameService gameService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/updateTeam")
    public void sendMessage(@Payload TeamNumberUpdateRequestDto request) {
        scoreboardService.teamNumberUpdate(request);
    }

    @MessageMapping("/updateGrade")
    public void sendMessage(@Payload GradeUpdateRequestDto request) {
        scoreboardService.gradeUpdate(request);
    }

    @MessageMapping("/updateScore")
    public void sendMessage(@Payload ScoreboardUpdate request) {
        scoreboardService.scoreUpdate(request);
    }

    @MessageMapping("/joinSide")
    public void sendMessage(@Payload SideJoinRequestDto request) {
        scoreboardService.sideJoin(request);
    }

    @MessageMapping("/confirm")
    public void sendMessage(@Payload ConfirmCheckRequestDto request) {
        scoreboardService.joinConfirm(request);
    }

    @MessageMapping("/scoreCounting")
    public void sendMessage(@Payload ScoreCountingUpdate request) {
        scoreboardService.scoreCounting(request);
    }

    @MessageMapping("/requestInitialData")
    public void sendInitialData(@Payload InitialDataRequestDto request) {
        scoreboardService.initialScoreboardData(request);
    }

    @MessageMapping("/startCardDraw")
    public void startCardDraw(@Payload CardDrawStartRequestDto request) {
        scoreboardService.startCardDraw(request);
    }

    @MessageMapping("/selectCard")
    public void selectCard(@Payload CardSelectRequestDto request) {
        scoreboardService.selectCard(request);
    }

    @MessageMapping("/resetCardDraw")
    public void resetCardDraw(@Payload CardDrawStartRequestDto request) {
        scoreboardService.resetCardDraw(request);
    }

    @MessageMapping("/updateAvg")
    public void updateAvg(@Payload AvgUpdateRequestDto request) {
        scoreboardService.updateAvg(request);
    }
}
