package com.kh.pinpal2.scoreboard.service;

import com.kh.pinpal2.base.exception.user.UserNotFoundException;
import com.kh.pinpal2.ceremony.entity.Ceremony;
import com.kh.pinpal2.ceremony.repository.CeremonyRepository;
import com.kh.pinpal2.ceremony_user.entity.CeremonyUser;
import com.kh.pinpal2.ceremony_user.repository.CeremonyUserRepository;
import com.kh.pinpal2.game.entity.Game;
import com.kh.pinpal2.game.repository.GameRepository;
import com.kh.pinpal2.scoreboard.dto.GameStopRequestDto;
import com.kh.pinpal2.user.entity.User;
import com.kh.pinpal2.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ScoreboardServiceImpl implements ScoreboardService {

    private final GameRepository gameRepository;
    private final UserRepository userRepository;
    private final CeremonyRepository ceremonyRepository;
    private final CeremonyUserRepository ceremonyUserRepository;

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
}
