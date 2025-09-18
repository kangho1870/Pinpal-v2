package com.kh.pinpal2.base.event.listener;

import com.kh.pinpal2.base.event.*;
import com.kh.pinpal2.scoreboard.dto.ScoreboardMemberRow;
import com.kh.pinpal2.scoreboard.dto.TeamNumberUpdateRequestDto;
import com.kh.pinpal2.scoreboard.dto.UserGradeUpdateDto;
import com.kh.pinpal2.scoreboard.dto.UserTeamUpdateDto;
import com.kh.pinpal2.scoreboard.repository.ScoreboardRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;
import com.kh.pinpal2.scoreboard.entity.Scoreboard;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebsocketRequiredEventListener {

    private final SimpMessagingTemplate messagingTemplate;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void update(ScoreboardTeamUpdate request) {
        Long gameId = request.gameId();
        List<UserTeamUpdateDto> users = request.users();

        log.info("팀 번호 배치 업데이트 이벤트 처리 시작: gameId={}, 사용자 수={}", gameId, users.size());

        // 모든 팀 업데이트를 한 번에 전송
        sendBatchTeamNumberUpdate(gameId, users);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void update(ScoreboardGradeUpdate request) {
        Long gameId = request.gameId();
        List<UserGradeUpdateDto> users = request.users();

        sendBatchGradeUpdate(gameId, users);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void update(ScoreUpdate request) {
        Long gameId = request.gameId();
        Long userId = request.userId();

        sendScoreUpdate(gameId, userId, request.score1(), request.score2(), request.score3(), request.score4());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void update(ScoreboardSideUpdate request) {
        Long gameId = request.gameId();
        Long userId = request.userId();
        String sideType = request.sideType();
        boolean joined = request.joined();

        sendSideUpdate(gameId, userId, sideType, joined);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void update(ScoreboardConfirmed request) {
        Long gameId = request.gameId();
        Long userId = request.userId();

        sendConfirmUpdate(gameId, userId, request.confirmed());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void update(ScoreboardCounting request) {
        Long gameId = request.gameId();

        sendScoreCountingUpdate(gameId, request.scoreCounting());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleGameParticipantJoin(GameParticipantJoinEvent event) {
        Long gameId = event.gameId();
        ScoreboardMemberRow newParticipant = event.newParticipant();

        log.info("새로운 회원 참여: gameId={}, userId={}, userName={}",
                gameId, newParticipant.memberId(), newParticipant.memberName());

        try {
            // 새로운 회원 참여 알림 전송
            Map<String, Object> joinNotification = new HashMap<>();
            joinNotification.put("type", "newParticipantJoin");
            joinNotification.put("gameId", gameId);
            joinNotification.put("timestamp", System.currentTimeMillis());
            joinNotification.put("newParticipant", newParticipant);

            String destination = "/sub/scoreboard/" + gameId;
            messagingTemplate.convertAndSend(destination, joinNotification);

            log.info("새로운 회원 참여 알림 전송 완료: destination={}, userId={}",
                    destination, newParticipant.memberId());

        } catch (Exception e) {
            log.error("새로운 회원 참여 알림 전송 실패: gameId={}, userId={}, error={}",
                    gameId, newParticipant.memberId(), e.getMessage());
        }
    }

    private void sendScoreCountingUpdate(Long gameId, boolean scoreCounting) {
        try {
            Map<String, Object> updateData = new HashMap<>();
            updateData.put("type", "scoreCountingUpdated");
            updateData.put("gameId", gameId);
            updateData.put("confirmed", scoreCounting);

            String destination = "/sub/scoreboard/" + gameId;
            messagingTemplate.convertAndSend(destination, updateData);
        } catch (Exception e) {

        }
    }

    private void sendConfirmUpdate(Long gameId, Long userId, boolean confirmed) {
        try {
            Map<String, Object> updateData = new HashMap<>();
            updateData.put("type", "confirmedUpdated");
            updateData.put("gameId", gameId);
            updateData.put("userId", userId);
            updateData.put("confirmed", confirmed);

            String destination = "/sub/scoreboard/" + gameId;
            messagingTemplate.convertAndSend(destination, updateData);
        } catch (Exception e) {

        }
    }

    private void sendSideUpdate(Long gameId, Long userId, String sideType, boolean joined) {
        try {
            Map<String, Object> updateData = new HashMap<>();
            updateData.put("type", "sideUpdated");
            updateData.put("gameId", gameId);
            updateData.put("userId", userId);
            updateData.put("sideType", sideType);
            updateData.put(sideType, joined);

            String destination = "/sub/scoreboard/" + gameId;
            messagingTemplate.convertAndSend(destination, updateData);
        } catch (Exception e) {
            log.error("사이드 업데이트 전송 실패: gameId={}, userId={}, sideType={}", gameId, userId, sideType, e);
        }
    }

    private void sendScoreUpdate(Long gameId, Long userId, int score1, int score2, int score3, int score4) {
        try {
            Map<String, Object> updateData = new HashMap<>();
            updateData.put("type", "scoreUpdated");
            updateData.put("gameId", gameId);
            updateData.put("userId", userId);
            updateData.put("score1", score1);
            updateData.put("score2", score2);
            updateData.put("score3", score3);
            updateData.put("score4", score4);

            String destination = "/sub/scoreboard/" + gameId;
            messagingTemplate.convertAndSend(destination, updateData);
        } catch (Exception e) {

        }
    }

    /**
     * 모든 팀 번호 업데이트를 배치로 전송
     */
    private void sendBatchTeamNumberUpdate(Long gameId, List<UserTeamUpdateDto> users) {
        try {
            Map<String, Object> batchUpdateData = new HashMap<>();
            batchUpdateData.put("type", "batchTeamNumberUpdate");
            batchUpdateData.put("gameId", gameId);
            batchUpdateData.put("timestamp", System.currentTimeMillis());
            
            // 모든 사용자의 팀 번호 변경 정보를 배열로 구성
            List<Map<String, Object>> teamUpdates = new ArrayList<>();
            users.forEach(user -> {
                Map<String, Object> userUpdate = new HashMap<>();
                userUpdate.put("userId", user.userId());
                userUpdate.put("teamNumber", user.teamNumber());
                teamUpdates.add(userUpdate);
            });
            
            batchUpdateData.put("updates", teamUpdates);
            batchUpdateData.put("count", teamUpdates.size());

            // 특정 게임의 구독자들에게만 전송
            String destination = "/sub/scoreboard/" + gameId;
            messagingTemplate.convertAndSend(destination, batchUpdateData);
            
            log.info("팀 번호 배치 업데이트 전송 완료: destination={}, 사용자 수={}", 
                    destination, teamUpdates.size());
                    
        } catch (Exception e) {
            log.error("팀 번호 배치 업데이트 전송 실패: gameId={}, 사용자 수={}, error={}", 
                    gameId, users.size(), e.getMessage());
        }
    }

    /**
     * 모든 grade 업데이트를 배치로 전송
     */
    private void sendBatchGradeUpdate(Long gameId, List<UserGradeUpdateDto> users) {
        try {
            Map<String, Object> batchUpdateData = new HashMap<>();
            batchUpdateData.put("type", "batchGradeUpdate");
            batchUpdateData.put("gameId", gameId);
            batchUpdateData.put("timestamp", System.currentTimeMillis());

            // 모든 사용자의 팀 번호 변경 정보를 배열로 구성
            List<Map<String, Object>> teamUpdates = new ArrayList<>();
            users.forEach(user -> {
                Map<String, Object> userUpdate = new HashMap<>();
                userUpdate.put("userId", user.userId());
                userUpdate.put("grade", user.grade());
                teamUpdates.add(userUpdate);
            });

            batchUpdateData.put("updates", teamUpdates);
            batchUpdateData.put("count", teamUpdates.size());

            // 특정 게임의 구독자들에게만 전송
            String destination = "/sub/scoreboard/" + gameId;
            messagingTemplate.convertAndSend(destination, batchUpdateData);

            log.info("grade 배치 업데이트 전송 완료: destination={}, 사용자 수={}",
                    destination, teamUpdates.size());

        } catch (Exception e) {
            log.error("grade 업데이트 전송 실패: gameId={}, 사용자 수={}, error={}",
                    gameId, users.size(), e.getMessage());
        }
    }
}
