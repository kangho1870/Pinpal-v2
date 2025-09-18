package com.kh.pinpal2.base.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kh.pinpal2.base.exception.game.GameNotFoundException;
import com.kh.pinpal2.base.exception.scoreboard.ScoreboardNotFoundException;
import com.kh.pinpal2.game.entity.Game;
import com.kh.pinpal2.game.repository.GameRepository;
import com.kh.pinpal2.scoreboard.dto.*;
import com.kh.pinpal2.scoreboard.entity.Scoreboard;
import com.kh.pinpal2.scoreboard.repository.ScoreboardRepository;
import com.kh.pinpal2.user_club.repository.UserClubRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

//@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketHandler extends TextWebSocketHandler {

    private static final ConcurrentHashMap<String, Set<WebSocketSession>> CLIENTS = new ConcurrentHashMap<String, Set<WebSocketSession>>();
    private final ScoreboardRepository scoreboardRepository;
    private final GameRepository gameRepository;
    private final UserClubRepository userClubRepository;
    private final ObjectMapper mapper;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        try {
            String scoreboardId = (String) session.getAttributes().get("scoreboardId");
            Boolean authenticated = (Boolean) session.getAttributes().get("authenticated");
            String token = (String) session.getAttributes().get("token");
            
            log.info("WebSocket 연결 성공 - ScoreboardId: {}, Authenticated: {}, Token: {}", 
                    scoreboardId, authenticated, token != null ? "있음" : "없음");
            
            // 클라이언트 세션 등록
            CLIENTS.computeIfAbsent(scoreboardId, key -> ConcurrentHashMap.newKeySet()).add(session);
            
            // 초기 데이터 전송 (실패해도 연결은 유지)
            try {
                String scoreboardData = loadScoreboardData(session);
                if (session.isOpen()) {
                    session.sendMessage(new TextMessage(scoreboardData));
                    log.info("초기 데이터 전송 성공");
                } else {
                    log.warn("세션이 이미 닫혀있어 메시지 전송 불가");
                }
            } catch (Exception e) {
                log.error("초기 데이터 전송 실패: {}", e.getMessage());
                // 연결은 유지하되 빈 데이터 전송
                if (session.isOpen()) {
                    session.sendMessage(new TextMessage("[]"));
                }
            }
            
        } catch (Exception e) {
            log.error("WebSocket 연결 설정 중 오류: {}", e.getMessage());
            // 연결 설정 실패 시 세션 종료
            if (session.isOpen()) {
                session.close(CloseStatus.PROTOCOL_ERROR);
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        try {
            String scoreboardId = (String) session.getAttributes().get("scoreboardId");
            log.info("WebSocket 연결 종료 - ScoreboardId: {}, Status: {}", scoreboardId, status);

            // `scoreboardId`에 해당하는 세션 집합에서 세션 제거
            Set<WebSocketSession> sessions = CLIENTS.get(scoreboardId);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    CLIENTS.remove(scoreboardId);
                }
            }
        } catch (Exception e) {
            log.error("WebSocket 연결 종료 처리 중 오류: {}", e.getMessage());
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        try {
            String payload = message.getPayload();
            log.info("WebSocket 메시지 수신: {}", payload);

            Map<String, Object> receivedData = mapper.readValue(payload, Map.class);

            String action = (String) receivedData.get("action");
            
            // 핑 메시지 처리 (연결 상태 확인용)
            if (action.equals("ping")) {
                log.info("핑 메시지 수신 - 연결 상태 확인");
                if (session.isOpen()) {
                    session.sendMessage(new TextMessage("{\"type\":\"pong\",\"timestamp\":" + System.currentTimeMillis() + "}"));
                }
                return;
            }
            
            if (action.equals("updateScore")) {
                ScoreboardUpdate scoreboard = mapper.convertValue(receivedData, ScoreboardUpdate.class);
                ScoreUpdateDto score = scoreboard.score();
                Long userId = scoreboard.userId();
                
                Long gameId;
                Object gameIdObj = scoreboard.gameId();
                if (gameIdObj instanceof String) {
                    gameId = Long.parseLong((String) gameIdObj);
                } else if (gameIdObj instanceof Number) {
                    gameId = ((Number) gameIdObj).longValue();
                } else {
                    log.error("Invalid gameId type in updateScore: {}", gameIdObj.getClass().getName());
                    return;
                }

                Scoreboard user = scoreboardRepository.findByGameIdAndUserId(gameId, userId).orElseThrow(
                        ScoreboardNotFoundException::new
                );
                
                // null 값 처리: null이면 0으로 설정
                int game1Score = score.game1Score() != null ? score.game1Score() : 0;
                int game2Score = score.game2Score() != null ? score.game2Score() : 0;
                int game3Score = score.game3Score() != null ? score.game3Score() : 0;
                int game4Score = score.game4Score() != null ? score.game4Score() : 0;
                
                user.updateScore(game1Score, game2Score, game3Score, game4Score);
                scoreboardRepository.save(user);
            } else if (action.equals("updateGrade")) {
                GradeUpdateRequestDto requestDTO = mapper.readValue(payload, GradeUpdateRequestDto.class);
                List<UserGradeUpdateDto> users = requestDTO.users();

                for (UserGradeUpdateDto user : users) {
                    Long memberId = user.userId();
                    Integer grade = user.grade();

                    scoreboardRepository.findByGameIdAndUserId(requestDTO.gameId(), memberId).ifPresent(scoreboard -> {
                        scoreboard.updateGrade(grade);
                        scoreboardRepository.save(scoreboard);
                    });
                }
            } else if (action.equals("updateTeamNumber")) {
                TeamNumberUpdateRequestDto requestDto = mapper.readValue(payload, TeamNumberUpdateRequestDto.class);
                List<UserTeamUpdateDto> users = requestDto.users();

                log.info("팀 번호 업데이트 요청 처리: gameId={}, 사용자 수={}", requestDto.gameId(), users.size());

                for (UserTeamUpdateDto user : users) {
                    Long userId = user.userId();
                    Integer teamNumber = user.teamNumber();

                    scoreboardRepository.findByGameIdAndUserId(requestDto.gameId(), userId).ifPresent(scoreboard -> {
                        // 기존 팀 번호 저장
                        Integer oldTeamNumber = scoreboard.getTeamNumber();
                        
                        // 새 팀 번호로 업데이트
                        scoreboard.updateTeamNumber(teamNumber);
                        scoreboardRepository.save(scoreboard);
                        
                        log.info("팀 번호 업데이트: userId={}, {} -> {}", userId, oldTeamNumber, teamNumber);
                        
                        // 특정 사용자의 팀 번호 변경만 전송 (STOMP 방식)
                        sendSpecificTeamUpdate(requestDto.gameId(), userId, teamNumber);
                    });
                }
            } else if (action.equals("updateTeam")) {
                // updateTeam 액션 처리 (프론트엔드에서 보내는 형식)
                Long gameId;
                Object gameIdObj = receivedData.get("gameId");
                if (gameIdObj instanceof String) {
                    gameId = Long.parseLong((String) gameIdObj);
                } else if (gameIdObj instanceof Number) {
                    gameId = ((Number) gameIdObj).longValue();
                } else {
                    log.error("Invalid gameId type: {}", gameIdObj.getClass().getName());
                    return;
                }
                
                List<Map<String, Object>> usersData = (List<Map<String, Object>>) receivedData.get("users");

                for (Map<String, Object> userData : usersData) {
                    Long userId;
                    Object userIdObj = userData.get("userId");
                    if (userIdObj instanceof String) {
                        userId = Long.parseLong((String) userIdObj);
                    } else if (userIdObj instanceof Number) {
                        userId = ((Number) userIdObj).longValue();
                    } else {
                        log.error("Invalid userId type: {}", userIdObj.getClass().getName());
                        continue;
                    }
                    
                    Integer teamNumber;
                    Object teamNumberObj = userData.get("teamNumber");
                    if (teamNumberObj instanceof String) {
                        teamNumber = Integer.parseInt((String) teamNumberObj);
                    } else if (teamNumberObj instanceof Number) {
                        teamNumber = ((Number) teamNumberObj).intValue();
                    } else {
                        log.error("Invalid teamNumber type: {}", teamNumberObj.getClass().getName());
                        continue;
                    }

                    scoreboardRepository.findByGameIdAndUserId(gameId, userId).ifPresent(scoreboard -> {
                        scoreboard.updateTeamNumber(teamNumber);
                        scoreboardRepository.save(scoreboard);
                    });
                }
            }else if (action.equals("updateSide")) {
                SideJoinRequestDto requestDto = mapper.readValue(payload, SideJoinRequestDto.class);
                log.info("updateSide 액션 처리: gameId={}, userId={}, sideType={}", 
                    requestDto.gameId(), requestDto.userId(), requestDto.sideType());

                scoreboardRepository.findByGameIdAndUserId(requestDto.gameId(), requestDto.userId()).ifPresent(scoreboard -> {
                    log.info("Scoreboard 찾음: side={}, sideAvg={}", scoreboard.isSide(), scoreboard.isSideAvg());
                    
                    if(requestDto.sideType().equals("grade1")) {
                        boolean newSide = !scoreboard.isSide();
                        scoreboard.updateSide(newSide);
                        log.info("side 업데이트: {} -> {}", !newSide, newSide);
                    }else if(requestDto.sideType().equals("avg")) {
                        boolean newSideAvg = !scoreboard.isSideAvg();
                        scoreboard.updateSideAvg(newSideAvg);
                        log.info("sideAvg 업데이트: {} -> {}", !newSideAvg, newSideAvg);
                    }
                    scoreboardRepository.save(scoreboard);
                    log.info("Scoreboard 저장 완료");
                });
            }else if (action.equals("updateConfirm")) {
                ConfirmCheckRequestDto requestDto = mapper.readValue(payload, ConfirmCheckRequestDto.class);
                log.info("updateConfirm 액션 처리: gameId={}, userId={}, code={}", 
                    requestDto.gameId(), requestDto.userId(), requestDto.code());

                scoreboardRepository.findByGameIdAndUserId(requestDto.gameId(), requestDto.userId()).ifPresent(scoreboard -> {
                    // Game 엔티티를 즉시 로딩
                    Game game = gameRepository.findById(requestDto.gameId()).orElse(null);
                    if (game == null) {
                        log.error("게임을 찾을 수 없습니다: gameId={}", requestDto.gameId());
                        return;
                    }
                    
                    log.info("Scoreboard 찾음: confirmedJoin={}, gameConfirmCode={}", 
                        scoreboard.isConfirmed(), game.getConfirmCode());
                    
                    if(game.getConfirmCode().equals(requestDto.code())) {
                        scoreboard.updateConfirmed(true);
                        log.info("참석 확정 성공: confirmedJoin=true");
                    } else {
                        log.info("확정 코드 불일치: 입력={}, 실제={}", 
                            requestDto.code(), game.getConfirmCode());
                    }
                    scoreboardRepository.save(scoreboard);
                    log.info("Scoreboard 저장 완료");
                });
            }else if (action.equals("updateScoreCounting")) {
                ScoreCountingUpdate requestDto = mapper.readValue(payload, ScoreCountingUpdate.class);
                
                Long gameId;
                Object gameIdObj = requestDto.gameId();
                if (gameIdObj instanceof String) {
                    gameId = Long.parseLong((String) gameIdObj);
                } else if (gameIdObj instanceof Number) {
                    gameId = ((Number) gameIdObj).longValue();
                } else {
                    log.error("Invalid gameId type in updateScoreCounting: {}", gameIdObj.getClass().getName());
                    return;
                }
                
                log.info("점수 집계 상태 변경 요청: gameId={}, scoreCounting={}",
                    gameId, requestDto.scoreCounting());
                
                // 게임의 점수 집계 상태를 변경
                if (gameId != null) {
                    Game findGame = gameRepository.findById(gameId).orElseThrow(
                            GameNotFoundException::new
                    );
                    findGame.updateScoreCounting(requestDto.scoreCounting());
                    gameRepository.save(findGame);
                }
            }

            // 특정 액션에 대해서만 전체 데이터 전송 (필요한 경우)
            if (action.equals("updateScore") || action.equals("updateGrade") || 
                action.equals("updateSide") || action.equals("updateConfirm") || 
                action.equals("updateScoreCounting")) {
                sendScoreboardData(session);
            }
            // updateTeamNumber는 이미 sendSpecificTeamUpdate로 처리됨
            
        } catch (Exception e) {
            log.error("WebSocket 메시지 처리 중 오류: {}", e.getMessage());
            // 오류 발생 시에도 연결은 유지
        }
    }

    public void sendScoreboardData(WebSocketSession session) throws Exception {
        try {
            String scoreboardId = (String) session.getAttributes().get("scoreboardId");
            String scoreboardData = loadScoreboardData(session);

            Set<WebSocketSession> sessions = CLIENTS.get(scoreboardId);
            if (sessions != null) {
                sessions.forEach(s -> {
                    try {
                        if (s.isOpen()) {
                            s.sendMessage(new TextMessage(scoreboardData));
                        }
                    } catch (IOException e) {
                        log.error("메시지 전송 실패: {}", e.getMessage());
                    }
                });
            }
        } catch (Exception e) {
            log.error("데이터 전송 중 오류: {}", e.getMessage());
        }
    }

    public String loadScoreboardData(WebSocketSession session) throws Exception {
        try {
            List<Map<String, Object>> data = new ArrayList<>();

            String scoreboardIdStr = (String) session.getAttributes().get("scoreboardId");
            if (scoreboardIdStr == null) {
                log.error("ScoreboardId가 없습니다.");
                return "[]";
            }

            Long scoreboardId = Long.parseLong(scoreboardIdStr);
            log.info("Scoreboard 데이터 로딩 중: {}", scoreboardId);

            List<ScoreboardMemberRow> scoreboards = scoreboardRepository.findAllWithMemberMetaByGameId(scoreboardId);
            if (scoreboards == null || scoreboards.isEmpty()) {
                log.info("게임 데이터가 없습니다: {}", scoreboardId);
                return "[]";
            }
            

            
            for (ScoreboardMemberRow scoreboard : scoreboards) {
                Map<String, Object> memberData = new HashMap<>();
                memberData.put("game1", scoreboard.game1());
                memberData.put("game2", scoreboard.game2());
                memberData.put("game3", scoreboard.game3());
                memberData.put("game4", scoreboard.game4());
                memberData.put("confirmedJoin", scoreboard.confirmedJoin());
                memberData.put("grade", scoreboard.grade());
                memberData.put("sideAvg", scoreboard.sideAvg());
                memberData.put("sideGrade1", scoreboard.side());
                memberData.put("teamNumber", scoreboard.teamNumber());
                memberData.put("memberId", scoreboard.memberId());
                memberData.put("gameName", scoreboard.gameName());
                memberData.put("memberName", scoreboard.memberName());
                memberData.put("memberProfile", scoreboard.memberProfile());
                memberData.put("scoreCounting", scoreboard.scoreCounting());
                memberData.put("memberRole", scoreboard.memberRole());
                memberData.put("memberAvg", scoreboard.memberAvg());
                memberData.put("gender", scoreboard.gender());

                
                data.add(memberData);
            }

            ObjectMapper mapper = new ObjectMapper();
            String jsonData = mapper.writeValueAsString(data);
            log.info("Scoreboard 데이터 로딩 완료: {} 멤버", data.size());
            return jsonData;
            
        } catch (Exception e) {
            log.error("Scoreboard 데이터 로딩 실패: {}", e.getMessage());
            return "[]";
        }
    }

    /**
     * 특정 사용자의 팀 번호 변경만 전송 (STOMP 방식)
     */
    private void sendSpecificTeamUpdate(Long gameId, Long userId, Integer teamNumber) {
        try {
            Map<String, Object> updateData = new HashMap<>();
            updateData.put("type", "teamNumberUpdate");
            updateData.put("gameId", gameId);
            updateData.put("userId", userId);
            updateData.put("teamNumber", teamNumber);
            updateData.put("timestamp", System.currentTimeMillis());

            String scoreboardId = gameId.toString();
            Set<WebSocketSession> sessions = CLIENTS.get(scoreboardId);
            
            if (sessions != null) {
                String jsonData = mapper.writeValueAsString(updateData);
                sessions.forEach(session -> {
                    try {
                        if (session.isOpen()) {
                            session.sendMessage(new TextMessage(jsonData));
                        }
                    } catch (IOException e) {
                        log.error("팀 번호 업데이트 전송 실패: {}", e.getMessage());
                    }
                });
                
                log.info("팀 번호 업데이트 전송 완료: gameId={}, userId={}, teamNumber={}, 세션 수={}", 
                        gameId, userId, teamNumber, sessions.size());
            }
        } catch (Exception e) {
            log.error("팀 번호 업데이트 전송 중 오류: {}", e.getMessage());
        }
    }
    

}
