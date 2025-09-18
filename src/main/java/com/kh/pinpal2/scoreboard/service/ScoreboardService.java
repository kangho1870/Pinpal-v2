package com.kh.pinpal2.scoreboard.service;

import com.kh.pinpal2.scoreboard.dto.*;

public interface ScoreboardService {
    void stopGame(GameStopRequestDto requestDto);
    void teamNumberUpdate(TeamNumberUpdateRequestDto requestDto);
    void gradeUpdate(GradeUpdateRequestDto request);
    void scoreUpdate(ScoreboardUpdate request);
    void sideJoin(SideJoinRequestDto request);
    void joinConfirm(ConfirmCheckRequestDto request);

    void scoreCounting(ScoreCountingUpdate request);

    void initialScoreboardData(InitialDataRequestDto request);
    
    void startCardDraw(CardDrawStartRequestDto request);
    void selectCard(CardSelectRequestDto request);
    void resetCardDraw(CardDrawStartRequestDto request);
}
