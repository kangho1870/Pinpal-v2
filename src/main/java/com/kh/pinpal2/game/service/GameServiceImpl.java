package com.kh.pinpal2.game.service;

import com.kh.pinpal2.base.dto.PageResponse;
import com.kh.pinpal2.base.event.GameParticipantJoinEvent;
import com.kh.pinpal2.base.exception.PermissionDeniedException;
import com.kh.pinpal2.base.exception.club.ClubNotFoundException;
import com.kh.pinpal2.base.exception.game.GameNotFoundException;
import com.kh.pinpal2.base.exception.game.UserAlreadyJoinedGameException;
import com.kh.pinpal2.base.exception.user.UserNotFoundException;
import com.kh.pinpal2.base.mapper.PageResponseMapper;
import com.kh.pinpal2.base.util.SecurityUtil;
import com.kh.pinpal2.ceremony.repository.CeremonyRepository;
import com.kh.pinpal2.ceremony_user.repository.CeremonyUserRepository;
import com.kh.pinpal2.club.entity.Club;
import com.kh.pinpal2.club.repository.ClubRepository;
import com.kh.pinpal2.game.dto.*;
import com.kh.pinpal2.game.entity.Game;
import com.kh.pinpal2.game.mapper.GameMapper;
import com.kh.pinpal2.game.repository.GameRepository;
import com.kh.pinpal2.scoreboard.dto.ScoreboardMemberRow;
import com.kh.pinpal2.scoreboard.dto.ScoreboardRespDto;
import com.kh.pinpal2.scoreboard.entity.Scoreboard;
import com.kh.pinpal2.scoreboard.repository.ScoreboardRepository;
import com.kh.pinpal2.user.entity.User;
import com.kh.pinpal2.user.repository.UserRepository;
import com.kh.pinpal2.user_club.entity.ClubRole;
import com.kh.pinpal2.user_club.entity.UserClub;
import com.kh.pinpal2.user_club.repository.UserClubRepository;
import com.querydsl.core.Tuple;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GameServiceImpl implements GameService {

    private final GameRepository gameRepository;
    private final ClubRepository clubRepository;
    private final UserRepository userRepository;
    private final UserClubRepository userClubRepository;
    private final ScoreboardRepository scoreboardRepository;
    private final CeremonyRepository ceremonyRepository;
    private final CeremonyUserRepository ceremonyUserRepository;
    private final GameMapper gameMapper;
    private final PageResponseMapper pageResponseMapper;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<GameRespDto> findAllByClubId(Long clubId, Instant cursor) {
        List<Game> games = gameRepository.findAllByClubId(clubId, cursor, 50);

        List<Game> content = games.size() > 50 ? games.subList(0, 50) : games;

        // 다음 커서(nextCursor) 계산
        Instant nextCursor = content.isEmpty()
                ? null
                : content.get(content.size() - 1).getCreatedAt();

        // 전체 개수(totalElements) 조회
        long totalElements = gameRepository.countByClubIdAndCursor(clubId, cursor);

        // DTO 변환
        List<GameRespDto> list = content.stream()
                .map(game -> {
                    List<Long> userIdsByGameId = gameRepository.findUserIdsByGameId(game.getId());

                    return gameMapper.toDto(game, userIdsByGameId.size(), userIdsByGameId);
                })
                .toList();

        // 페이징 메타데이터 구성
        Map<String, Object> result = new HashMap<>();
        result.put("nextCursor", nextCursor);
        result.put("hasNext", games.size() > 50);
        result.put("totalElements", totalElements);

        return pageResponseMapper.pageResponse(list, result);
    }

    @Override
    @Transactional
    public GameRespDto registerGame(GameCreateDto gameCreateDto) {
        Club club = clubRepository.findById(gameCreateDto.clubId()).orElseThrow(
                ClubNotFoundException::new
        );

        User user = SecurityUtil.getCurrentUser(userRepository);

        UserClub userClub = userClubRepository.findByClubIdAndUserId(club.getId(), user.getId()).orElseThrow(
                PermissionDeniedException::new
        );

        if (userClub.getRole().equals(ClubRole.MEMBER)) {
            throw new PermissionDeniedException();
        }

        Game game = new Game(gameCreateDto, club);
        Game savedGame = gameRepository.save(game);

        return gameMapper.toDto(savedGame, 0, List.of());
    }

    @Override
    @Transactional
    public GameRespDto updateGame(GameUpdateDto gameUpdateDto) {
        Game game = gameRepository.findById(gameUpdateDto.gameId()).orElseThrow(
                GameNotFoundException::new
        );

        Club club = clubRepository.findById(gameUpdateDto.clubId()).orElseThrow(
                ClubNotFoundException::new
        );

        User user = SecurityUtil.getCurrentUser(userRepository);

        UserClub userClub = userClubRepository.findByClubIdAndUserId(club.getId(), user.getId()).orElseThrow(
                PermissionDeniedException::new
        );

        if (userClub.getRole().equals(ClubRole.MEMBER)) {
            throw new PermissionDeniedException();
        }

        game.update(gameUpdateDto);
        Game savedGame = gameRepository.save(game);
        List<Long> userIdsByGameId = gameRepository.findUserIdsByGameId(game.getId());
        long userCount = userIdsByGameId.size();

        return gameMapper.toDto(savedGame, userCount,  userIdsByGameId);
    }

    @Override
    @Transactional
    public void deleteGame(Long gameId) {
        if (!gameRepository.existsById(gameId)) throw new GameNotFoundException();

        scoreboardRepository.deleteByGameIds(List.of(gameId));

        List<Long> ceremonyIds = ceremonyRepository.findIdsByGameIds(List.of(gameId));
        if (!ceremonyIds.isEmpty()) {
            ceremonyUserRepository.deleteByCeremonyIds(ceremonyIds);
        }
        ceremonyRepository.deleteByGameIds(List.of(gameId));

        gameRepository.deleteById(gameId);
    }

    @Override
    @Transactional
    public GameRespDto joinGame(Long gameId) {
        Game game = gameRepository.findById(gameId).orElseThrow(
                GameNotFoundException::new
        );

        User user = SecurityUtil.getCurrentUser(userRepository);

        userClubRepository.findByClubIdAndUserId(game.getClub().getId(), user.getId()).orElseThrow(
                PermissionDeniedException::new
        );

        if (scoreboardRepository.existsByGameIdAndUserId(gameId, user.getId())) {
            throw new UserAlreadyJoinedGameException();
        }

        UserClub userClub = userClubRepository.findByClubIdAndUserId(game.getClub().getId(), user.getId()).orElseThrow(UserNotFoundException::new);
        Scoreboard scoreboard = new Scoreboard(game, user, userClub.getAvg());
        Scoreboard savedScoreboard = scoreboardRepository.save(scoreboard);

        // 새로운 회원 참여 이벤트 발행

        ScoreboardMemberRow newUser = new ScoreboardMemberRow(
                savedScoreboard.getId(),
                user.getId(),
                user.getName(),
                user.getProfile(),
                game.getId(),
                game.getName(),
                game.isScoreCounting(),
                game.isCardDrow(),
                0,
                0,
                0,
                0,
                0,
                false,
                false,
                false,
                0,
                userClub.getRole(),
                userClub.getAvg(),
                user.getGender()
        );
        eventPublisher.publishEvent(new GameParticipantJoinEvent(gameId, newUser));

        List<Long> userIdsByGameId = gameRepository.findUserIdsByGameId(gameId);
        long userCount = userIdsByGameId.size();

        return gameMapper.toDto(game, userCount, userIdsByGameId);
    }

    @Override
    @Transactional
    public GameRespDto joinCancelGame(Long gameId) {
        Game game = gameRepository.findById(gameId).orElseThrow(
                GameNotFoundException::new
        );

        User user = SecurityUtil.getCurrentUser(userRepository);

        userClubRepository.findByClubIdAndUserId(game.getClub().getId(), user.getId()).orElseThrow(
                PermissionDeniedException::new
        );

        Scoreboard scoreboard = scoreboardRepository.findByGameIdAndUserId(gameId, user.getId()).orElseThrow(
                () -> new RuntimeException("참여하지 않은 게임입니다.")
        );

        scoreboardRepository.deleteById(scoreboard.getId());
        List<Long> userIdsByGameId = gameRepository.findUserIdsByGameId(gameId);
        long userCount = userIdsByGameId.size();

        return gameMapper.toDto(game, userCount,  userIdsByGameId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<GameParticipantDto> getGameParticipants(Long gameId) {
        Game game = gameRepository.findById(gameId).orElseThrow(
                GameNotFoundException::new
        );

        User user = SecurityUtil.getCurrentUser(userRepository);

        userClubRepository.findByClubIdAndUserId(game.getClub().getId(), user.getId()).orElseThrow(
                PermissionDeniedException::new
        );

        return scoreboardRepository.findAllByGameId(gameId).stream()
                .map(scoreboard -> new GameParticipantDto(
                        scoreboard.getUser().getId(),
                        scoreboard.getUser().getName(),
                        scoreboard.getUser().getProfile(),
                        scoreboard.getUser().getRole().name()
                ))
                .toList();
    }

    @Override
    public List<GameScoreboardsRespDto> getScoreboardByClubId(Long clubId, LocalDate startDate, LocalDate endDate, String type) {
        clubRepository.findById(clubId).orElseThrow(ClubNotFoundException::new);

        List<GameRespDto> games = gameRepository.findAllByClubIdAndFilter(clubId, startDate, endDate, type).stream()
                .map(game -> {
                    List<Long> userIdsByGameId = gameRepository.findUserIdsByGameId(game.getId());
                    return gameMapper.toDto(game, userIdsByGameId.size(), userIdsByGameId);
                })
                .toList();

        List<GameScoreboardsRespDto> result = new ArrayList<>();

        games.forEach(game -> {
            result.add(new GameScoreboardsRespDto(
                    game, scoreboardRepository.findAllByGameId(game.id()).stream()
                    .map(scoreboard -> new ScoreboardRespDto(
                            scoreboard.getUser().getId(),
                            scoreboard.getScore1(),
                            scoreboard.getScore2(),
                            scoreboard.getScore3(),
                            scoreboard.getScore4(),
                            scoreboard.getGrade(),
                            scoreboard.getAvg(),
                            scoreboard.getTeamNumber()
                    )).toList()
            ));
        });

        return result;
    }
}
