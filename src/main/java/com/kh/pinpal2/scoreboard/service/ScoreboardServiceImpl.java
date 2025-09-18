package com.kh.pinpal2.scoreboard.service;

import com.kh.pinpal2.base.event.*;
import com.kh.pinpal2.base.exception.game.GameNotFoundException;
import com.kh.pinpal2.base.exception.scoreboard.ScoreboardNotFoundException;
import com.kh.pinpal2.base.exception.user.UserNotFoundException;
import com.kh.pinpal2.ceremony.entity.Ceremony;
import com.kh.pinpal2.ceremony.repository.CeremonyRepository;
import com.kh.pinpal2.ceremony_user.entity.CeremonyUser;
import com.kh.pinpal2.ceremony_user.repository.CeremonyUserRepository;
import com.kh.pinpal2.game.entity.Game;
import com.kh.pinpal2.game.repository.GameRepository;
import com.kh.pinpal2.scoreboard.dto.*;
import com.kh.pinpal2.scoreboard.entity.Scoreboard;
import com.kh.pinpal2.scoreboard.repository.ScoreboardRepository;
import com.kh.pinpal2.user.entity.User;
import com.kh.pinpal2.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ScoreboardServiceImpl implements ScoreboardService {

    private final GameRepository gameRepository;
    private final UserRepository userRepository;
    private final CeremonyRepository ceremonyRepository;
    private final CeremonyUserRepository ceremonyUserRepository;
    private final ScoreboardRepository scoreboardRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final SimpMessagingTemplate simpMessagingTemplate;


    @Override
    public void stopGame(GameStopRequestDto requestDto) {
        log.info("게임 종료 요청: gameId={}", requestDto.gameId());
        log.info("수상자: {}", requestDto);
        
        // 게임을 찾아서 종료 상태로 변경
        Game game = gameRepository.findById(requestDto.gameId())
                .orElseThrow(() -> new RuntimeException("게임을 찾을 수 없습니다: " + requestDto.gameId()));
        
        // 게임 상태를 종료로 변경
        game.updateStatus("FINISHED");
        
        // 점수 집계를 완료 상태로 변경
        game.updateScoreCounting(false);
        
        // 게임 저장
        gameRepository.save(game);
        
        // 시상식 데이터 생성 (선택적 - 필요시에만)
        if (shouldCreateCeremonies(requestDto)) {
            createCeremonies(game, requestDto);
        }
        
        log.info("게임 종료 완료: gameId={}", requestDto.gameId());
    }

    @Override
    public void teamNumberUpdate(TeamNumberUpdateRequestDto requestDto) {
        Long gameId = requestDto.gameId();
        gameRepository.findById(gameId).orElseThrow(GameNotFoundException::new);

        List<UserTeamUpdateDto> users = requestDto.users();
        log.info("팀 번호 배치 업데이트 시작: gameId={}, 사용자 수={}", gameId, users.size());

        // 각 사용자의 팀 번호를 업데이트 (DB 저장만)
        users.forEach(user -> {
            scoreboardRepository.findByGameIdAndUserId(gameId, user.userId())
                    .ifPresent(scoreboard -> {

                        // 새 팀 번호로 업데이트
                        scoreboard.updateTeamNumber(user.teamNumber());
                        scoreboardRepository.save(scoreboard);

                        log.info("팀 번호 업데이트: userId={} -> {}",
                                user.userId(), user.teamNumber());
                    });
        });

        // 모든 업데이트가 완료된 후 이벤트 퍼블리셔로 배치 전송
        // (트랜잭션 커밋 후 WebsocketRequiredEventListener에서 처리됨)
        log.info("팀 번호 배치 업데이트 완료: gameId={}, 사용자 수={}", gameId, users.size());
        eventPublisher.publishEvent(new ScoreboardTeamUpdate(gameId, users));
    }

    @Override
    public void gradeUpdate(GradeUpdateRequestDto request) {
        Long gameId = request.gameId();
        gameRepository.findById(gameId).orElseThrow(GameNotFoundException::new);

        request.users().forEach(user -> {
            scoreboardRepository.findByGameIdAndUserId(gameId, user.userId())
                    .ifPresent(scoreboard -> {
                        scoreboard.updateGrade(user.grade());
                        scoreboardRepository.save(scoreboard);
                    });
        });

        eventPublisher.publishEvent(new ScoreboardGradeUpdate(gameId, request.users()));
    }

    @Override
    public void scoreUpdate(ScoreboardUpdate request) {
        Long gameId = request.gameId();
        gameRepository.findById(gameId).orElseThrow(GameNotFoundException::new);

        Long userId = request.userId();
        userRepository.findById(userId).orElseThrow(UserNotFoundException::new);

        Scoreboard user = scoreboardRepository.findByGameIdAndUserId(gameId, userId).orElseThrow(
                ScoreboardNotFoundException::new
        );

        ScoreUpdateDto score = request.score();

        // null 값 처리: null이면 0으로 설정
        int game1Score = score.game1Score() != null ? score.game1Score() : 0;
        int game2Score = score.game2Score() != null ? score.game2Score() : 0;
        int game3Score = score.game3Score() != null ? score.game3Score() : 0;
        int game4Score = score.game4Score() != null ? score.game4Score() : 0;

        user.updateScore(game1Score, game2Score, game3Score, game4Score);
        Scoreboard save = scoreboardRepository.save(user);

        eventPublisher.publishEvent(new ScoreUpdate(gameId, userId, game1Score, game2Score, game3Score, game4Score));
    }

    @Override
    public void sideJoin(SideJoinRequestDto request) {
        Long gameId = request.gameId();
        gameRepository.findById(gameId).orElseThrow(GameNotFoundException::new);
        Long userId = request.userId();

        String sideType = request.sideType();

        userRepository.findById(request.userId()).orElseThrow(UserNotFoundException::new);
        scoreboardRepository.findByGameIdAndUserId(gameId, userId).ifPresent(scoreboard -> {
            if(sideType.equals("grade1")) {
                boolean newSide = !scoreboard.isSide();
                scoreboard.updateSide(newSide);
                log.info("side 업데이트: {} -> {}", !newSide, newSide);
                Scoreboard saved = scoreboardRepository.save(scoreboard);
                eventPublisher.publishEvent(new ScoreboardSideUpdate(gameId, userId, sideType, saved.isSide()));
            }else if(sideType.equals("avg")) {
                boolean newSideAvg = !scoreboard.isSideAvg();
                scoreboard.updateSideAvg(newSideAvg);
                log.info("sideAvg 업데이트: {} -> {}", !newSideAvg, newSideAvg);
                Scoreboard saved = scoreboardRepository.save(scoreboard);
                eventPublisher.publishEvent(new ScoreboardSideUpdate(gameId, userId, sideType, saved.isSideAvg()));
            }
        });
    }

    @Override
    public void joinConfirm(ConfirmCheckRequestDto request) {
        Long gameId = request.gameId();
        Game game = gameRepository.findById(gameId).orElseThrow(GameNotFoundException::new);
        Long userId = request.userId();
        userRepository.findById(userId).orElseThrow(UserNotFoundException::new);

        boolean confirmed = false;
        Scoreboard scoreboard = scoreboardRepository.findByGameIdAndUserId(game.getId(), userId).orElseThrow(ScoreboardNotFoundException::new);

        if (game.getConfirmCode().equals(request.code())) {
            scoreboard.updateConfirmed(true);
            confirmed = true;
            scoreboardRepository.save(scoreboard);
        } else {
            throw new IllegalArgumentException("코드가 일치하지 않습니다.");
        }

        eventPublisher.publishEvent(new ScoreboardConfirmed(gameId, userId, confirmed));
    }

    @Override
    public void scoreCounting(ScoreCountingUpdate request) {
        Long gameId = request.gameId();
        Game game = gameRepository.findById(gameId).orElseThrow(GameNotFoundException::new);

        List<Long> list = scoreboardRepository.findAllByGameId(gameId).stream()
                .map(scoreboard -> scoreboard.getUser().getId())
                .toList();

        if (list.contains(request.userId())) {
            game.updateScoreCounting(request.scoreCounting());
            gameRepository.save(game);
        }

        eventPublisher.publishEvent(new ScoreboardCounting(gameId, game.isScoreCounting()));
    }

    @Override
    public void initialScoreboardData(InitialDataRequestDto request) {
        Long gameId = request.gameId();
        Game game = gameRepository.findById(gameId).orElseThrow(GameNotFoundException::new);

        List<ScoreboardMemberRow> scoreboards = scoreboardRepository.findAllWithMemberMetaByGameId(game.getId());

        // 카드뽑기 데이터도 함께 전송
        Map<String, Object> initialData = new HashMap<>();
        initialData.put("type", "initialData");
        initialData.put("scoreboards", scoreboards);
        initialData.put("cardDrawStarted", game.isCardDraw());
        
        // 카드뽑기가 시작된 경우에만 카드뽑기 데이터 포함
        if (game.isCardDraw()) {
            List<Scoreboard> allScoreboards = scoreboardRepository.findAllByGameId(gameId);
            Map<Integer, List<Scoreboard>> gradeGroups = allScoreboards.stream()
                    .collect(Collectors.groupingBy(scoreboard -> scoreboard.getGrade() != null ? scoreboard.getGrade() : 0));
            
            Map<Integer, List<Integer>> cardDrawData = new HashMap<>();
            
            for (Map.Entry<Integer, List<Scoreboard>> entry : gradeGroups.entrySet()) {
                Integer grade = entry.getKey();
                List<Scoreboard> members = entry.getValue();
                int memberCount = members.size();
                
                // 1부터 memberCount까지의 숫자를 생성하고 섞기
                List<Integer> teamNumbers = IntStream.rangeClosed(1, memberCount)
                        .boxed()
                        .collect(Collectors.toList());
                Collections.shuffle(teamNumbers);
                
                cardDrawData.put(grade, teamNumbers);
            }
            
            initialData.put("cardDrawData", cardDrawData);
            
            // 선택된 카드 정보도 포함
            Map<String, Object> selectedCards = new HashMap<>();
            for (Scoreboard scoreboard : allScoreboards) {
                if (scoreboard.getTeamNumber() != null && scoreboard.getTeamNumber() > 0) {
                    Integer grade = scoreboard.getGrade() != null ? scoreboard.getGrade() : 0;
                    // 해당 군의 카드 배열에서 팀 번호의 인덱스 찾기
                    List<Integer> gradeCards = cardDrawData.get(grade);
                    if (gradeCards != null) {
                        int cardIndex = gradeCards.indexOf(scoreboard.getTeamNumber());
                        if (cardIndex >= 0) {
                            String cardKey = grade + "-" + cardIndex;
                            selectedCards.put(cardKey, Map.of(
                                "userId", scoreboard.getUser().getId(),
                                "teamNumber", scoreboard.getTeamNumber()
                            ));
                        }
                    }
                }
            }
            
            initialData.put("selectedCards", selectedCards);
            log.info("초기 데이터에 카드뽑기 데이터 및 선택된 카드 포함: gameId={}, cardDrawData={}, selectedCards={}, cardDrawStarted={}", 
                    gameId, cardDrawData, selectedCards, game.isCardDraw());
        } else {
            log.info("카드뽑기가 시작되지 않음: gameId={}, cardDrawStarted={}", gameId, game.isCardDraw());
        }

        simpMessagingTemplate.convertAndSend("/sub/scoreboard/" + request.gameId(), initialData);
    }

    /**
     * 시상식 데이터 생성이 필요한지 확인
     */
    private boolean shouldCreateCeremonies(GameStopRequestDto requestDto) {
        // 실제 시상 대상이 있는 경우에만 생성
        return requestDto.pin1st() != null || 
               requestDto.avgTopScoreMember() != null ||
               requestDto.grade1st() != null ||
               requestDto.grade2st() != null ||
               requestDto.grade3st() != null ||
               requestDto.grade4st() != null ||
               requestDto.grade5st() != null ||
               requestDto.grade6st() != null ||
               requestDto.highScoreOfMan() != null ||
               requestDto.highScoreOfGirl() != null ||
               (requestDto.team1stIds() != null && !requestDto.team1stIds().isEmpty());
    }
    
    /**
     * 시상식 데이터 생성 (별도 메서드로 분리)
     */
    private void createCeremonies(Game game, GameStopRequestDto requestDto) {
        log.info("시상식 데이터 생성 시작: gameId={}", game.getId());
        
        List<Ceremony> ceremonies = new ArrayList<>();
        List<CeremonyUser> ceremonyUsers = new ArrayList<>();
        
        // 총핀 1등
        if (requestDto.pin1st() != null) {
            Ceremony ceremony = new Ceremony(0, 1, "pin1st", game);
            ceremonies.add(ceremony);
            
            User user = userRepository.findById(requestDto.pin1st())
                    .orElseThrow(() -> new UserNotFoundException());
            ceremonyUsers.add(new CeremonyUser(user, ceremony));
        }
        
        // 에버 1등
        if (requestDto.avgTopScoreMember() != null) {
            Ceremony ceremony = new Ceremony(0, 1, "avgTopScoreMember", game);
            ceremonies.add(ceremony);
            
            User user = userRepository.findById(requestDto.avgTopScoreMember())
                    .orElseThrow(() -> new UserNotFoundException());
            ceremonyUsers.add(new CeremonyUser(user, ceremony));
        }
        
        // 군별 1등 (1~6군)
        createGradeCeremonies(game, requestDto, ceremonies, ceremonyUsers);
        
        // 하이스코어 (남자/여자)
        if (requestDto.highScoreOfMan() != null) {
            Ceremony ceremony = new Ceremony(0, 1, "highScoreOfMan", game);
            ceremonies.add(ceremony);
            
            User user = userRepository.findById(requestDto.highScoreOfMan())
                    .orElseThrow(() -> new UserNotFoundException());
            ceremonyUsers.add(new CeremonyUser(user, ceremony));
        }
        
        if (requestDto.highScoreOfGirl() != null) {
            Ceremony ceremony = new Ceremony(0, 1, "highScoreOfGirl", game);
            ceremonies.add(ceremony);
            
            User user = userRepository.findById(requestDto.highScoreOfGirl())
                    .orElseThrow(() -> new UserNotFoundException());
            ceremonyUsers.add(new CeremonyUser(user, ceremony));
        }
        
        // 팀 1등 (여러 명일 수 있음)
        if (requestDto.team1stIds() != null && !requestDto.team1stIds().isEmpty()) {
            Ceremony ceremony = new Ceremony(0, 1, "team1st", game);
            ceremonies.add(ceremony);
            
            // 팀 1등 멤버들을 모두 저장
            for (Long memberId : requestDto.team1stIds()) {
                User user = userRepository.findById(memberId)
                        .orElseThrow(() -> new UserNotFoundException());
                ceremonyUsers.add(new CeremonyUser(user, ceremony));
            }
        }
        
        // 배치 저장 (성능 최적화)
        if (!ceremonies.isEmpty()) {
            // Ceremony 먼저 저장 (ID 생성 필요)
            ceremonyRepository.saveAll(ceremonies);
            
            // CeremonyUser 저장
            if (!ceremonyUsers.isEmpty()) {
                ceremonyUserRepository.saveAll(ceremonyUsers);
            }
            
            log.info("시상식 데이터 생성 완료: {}개 시상식, {}개 수상자", 
                    ceremonies.size(), ceremonyUsers.size());
        }
    }
    
    /**
     * 군별 시상식 생성
     */
    private void createGradeCeremonies(Game game, GameStopRequestDto requestDto, 
                                     List<Ceremony> ceremonies, List<CeremonyUser> ceremonyUsers) {
        Long[] gradeWinners = {
            requestDto.grade1st(), requestDto.grade2st(), requestDto.grade3st(),
            requestDto.grade4st(), requestDto.grade5st(), requestDto.grade6st()
        };
        
        for (int i = 0; i < gradeWinners.length; i++) {
            if (gradeWinners[i] != null) {
                Ceremony ceremony = new Ceremony(i + 1, 1, "grade" + (i + 1), game);
                ceremonies.add(ceremony);
                
                User user = userRepository.findById(gradeWinners[i])
                        .orElseThrow(UserNotFoundException::new);
                ceremonyUsers.add(new CeremonyUser(user, ceremony));
            }
        }
    }

    /**
     * 카드뽑기 시작 - 각 군별로 랜덤 팀 번호 배열 생성
     */
    @Override
    public void startCardDraw(CardDrawStartRequestDto request) {
        log.info("카드뽑기 시작: gameId={}", request.gameId());
        
        try {
            // 게임 조회 및 카드뽑기 상태 활성화
            Game game = gameRepository.findById(request.gameId())
                    .orElseThrow(() -> new RuntimeException("게임을 찾을 수 없습니다."));
            
            // 카드뽑기 상태가 아직 활성화되지 않았다면 활성화
            if (!game.isCardDraw()) {
                game.updateCardDraw();
                gameRepository.save(game);
                log.info("카드뽑기 상태 활성화: gameId={}", request.gameId());
            }
            
            // 게임의 모든 멤버 조회
            List<Scoreboard> scoreboards = scoreboardRepository.findAllByGameId(request.gameId());
            
            // 군별로 멤버 그룹화
            Map<Integer, List<Scoreboard>> gradeGroups = scoreboards.stream()
                    .collect(Collectors.groupingBy(scoreboard -> scoreboard.getGrade() != null ? scoreboard.getGrade() : 0));
            
            // 각 군별로 랜덤 팀 번호 배열 생성
            Map<Integer, List<Integer>> cardDrawData = new HashMap<>();
            
            for (Map.Entry<Integer, List<Scoreboard>> entry : gradeGroups.entrySet()) {
                Integer grade = entry.getKey();
                List<Scoreboard> members = entry.getValue();
                int memberCount = members.size();
                
                // 1부터 memberCount까지의 숫자를 생성하고 섞기
                List<Integer> teamNumbers = IntStream.rangeClosed(1, memberCount)
                        .boxed()
                        .collect(Collectors.toList());
                Collections.shuffle(teamNumbers);
                
                cardDrawData.put(grade, teamNumbers);
                log.info("군 {}: {}명, 랜덤 팀 번호 배열: {}", grade, memberCount, teamNumbers);
            }
            
            // STOMP 메시지로 모든 클라이언트에게 카드뽑기 데이터 전송
            Map<String, Object> cardDrawStart = new HashMap<>();
            cardDrawStart.put("type", "cardDrawStart");
            cardDrawStart.put("gameId", request.gameId());
            cardDrawStart.put("cardData", cardDrawData);
            cardDrawStart.put("timestamp", System.currentTimeMillis());
            
            String destination = "/sub/scoreboard/" + request.gameId();
            simpMessagingTemplate.convertAndSend(destination, cardDrawStart);
            log.info("카드뽑기 시작 알림 전송 완료: destination={}", destination);
            
        } catch (Exception e) {
            log.error("카드뽑기 시작 실패: gameId={}, error={}", request.gameId(), e.getMessage());
        }
    }

    /**
     * 카드 선택 - 사용자가 카드를 선택했을 때 팀 번호 업데이트
     */
    @Override
    public void selectCard(CardSelectRequestDto request) {
        log.info("카드 선택: gameId={}, userId={}, grade={}, cardIndex={}", 
                request.gameId(), request.userId(), request.grade(), request.cardIndex());
        
        try {
            // 해당 사용자의 scoreboard 조회
            Scoreboard scoreboard = scoreboardRepository.findByGameIdAndUserId(request.gameId(), request.userId())
                    .orElseThrow(() -> new RuntimeException("사용자의 scoreboard를 찾을 수 없습니다."));
            
            // 실제 팀 번호 계산 (카드에 있는 팀 번호 사용)
            int actualTeamNumber = request.teamNumber();
            scoreboard.updateTeamNumber(actualTeamNumber);
            scoreboardRepository.save(scoreboard);
            
            log.info("팀 번호 업데이트 완료: userId={}, teamNumber={}", request.userId(), actualTeamNumber);
            
            // STOMP 메시지로 모든 클라이언트에게 카드 선택 알림 전송
            Map<String, Object> cardSelected = new HashMap<>();
            cardSelected.put("type", "cardSelected");
            cardSelected.put("gameId", request.gameId());
            cardSelected.put("userId", request.userId());
            cardSelected.put("grade", request.grade());
            cardSelected.put("cardIndex", request.cardIndex());
            cardSelected.put("teamNumber", actualTeamNumber);
            cardSelected.put("timestamp", System.currentTimeMillis());
            
            String destination = "/sub/scoreboard/" + request.gameId();
            simpMessagingTemplate.convertAndSend(destination, cardSelected);
            log.info("카드 선택 알림 전송 완료: destination={}", destination);
            
        } catch (Exception e) {
            log.error("카드 선택 실패: gameId={}, userId={}, error={}", 
                    request.gameId(), request.userId(), e.getMessage());
        }
    }

    /**
     * 카드뽑기 및 팀 초기화
     */
    @Override
    public void resetCardDraw(CardDrawStartRequestDto request) {
        log.info("카드뽑기 및 팀 초기화: gameId={}", request.gameId());
        
        try {
            // 1. 모든 멤버의 팀 번호를 0으로 초기화
            List<Scoreboard> scoreboards = scoreboardRepository.findAllByGameId(request.gameId());
            for (Scoreboard scoreboard : scoreboards) {
                scoreboard.updateTeamNumber(0);
            }
            scoreboardRepository.saveAll(scoreboards);
            
            // 2. 게임의 카드뽑기 상태를 false로 설정
            Game game = gameRepository.findById(request.gameId())
                    .orElseThrow(() -> new RuntimeException("게임을 찾을 수 없습니다."));
            
            if (game.isCardDraw()) {
                game.updateCardDraw();
                gameRepository.save(game);
                log.info("카드뽑기 상태 비활성화: gameId={}", request.gameId());
            }
            
            // 3. STOMP 메시지로 모든 클라이언트에게 초기화 알림 전송
            Map<String, Object> cardDrawReset = new HashMap<>();
            cardDrawReset.put("type", "cardDrawReset");
            cardDrawReset.put("gameId", request.gameId());
            cardDrawReset.put("timestamp", System.currentTimeMillis());
            
            String destination = "/sub/scoreboard/" + request.gameId();
            simpMessagingTemplate.convertAndSend(destination, cardDrawReset);
            log.info("카드뽑기 초기화 알림 전송 완료: destination={}", destination);
            
        } catch (Exception e) {
            log.error("카드뽑기 초기화 실패: gameId={}, error={}", request.gameId(), e.getMessage());
        }
    }
}
