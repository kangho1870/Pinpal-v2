package com.kh.pinpal2.game.service;

import com.kh.pinpal2.base.dto.PageResponse;
import com.kh.pinpal2.base.exception.PermissionDeniedException;
import com.kh.pinpal2.base.exception.club.ClubNotFoundException;
import com.kh.pinpal2.base.exception.game.GameNotFoundException;
import com.kh.pinpal2.base.exception.game.UserAlreadyJoinedGameException;
import com.kh.pinpal2.base.mapper.PageResponseMapper;
import com.kh.pinpal2.base.util.SecurityUtil;
import com.kh.pinpal2.ceremony.repository.CeremonyRepository;
import com.kh.pinpal2.ceremony_user.repository.CeremonyUserRepository;
import com.kh.pinpal2.club.entity.Club;
import com.kh.pinpal2.club.repository.ClubRepository;
import com.kh.pinpal2.game.dto.GameCreateDto;
import com.kh.pinpal2.game.dto.GameRespDto;
import com.kh.pinpal2.game.dto.GameUpdateDto;
import com.kh.pinpal2.game.dto.GameParticipantDto;
import com.kh.pinpal2.game.entity.Game;
import com.kh.pinpal2.game.mapper.GameMapper;
import com.kh.pinpal2.game.repository.GameRepository;
import com.kh.pinpal2.scoreboard.entity.Scoreboard;
import com.kh.pinpal2.scoreboard.repository.ScoreboardRepository;
import com.kh.pinpal2.user.entity.User;
import com.kh.pinpal2.user.repository.UserRepository;
import com.kh.pinpal2.user_club.entity.ClubRole;
import com.kh.pinpal2.user_club.entity.UserClub;
import com.kh.pinpal2.user_club.repository.UserClubRepository;
import com.querydsl.core.Tuple;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
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

    @Override
    @Transactional(readOnly = true)
    public PageResponse<GameRespDto> findAllByClubId(Long clubId, Instant cursor) {
        List<Tuple> gameTuple = gameRepository.findAllByClubId(clubId, cursor, 50);

        List<Tuple> contentTuple = gameTuple.size() > 50 ? gameTuple.subList(0, 50) : gameTuple;

        // 다음 커서(nextCursor) 계산
        Instant nextCursor = contentTuple.isEmpty()
                ? null
                : contentTuple.get(contentTuple.size() - 1).get(0, Game.class).getCreatedAt();

        // 전체 개수(totalElements) 조회
        long totalElements = gameRepository.countByClubIdAndCursor(clubId, cursor);

        // DTO 변환
        List<GameRespDto> list = contentTuple.stream()
                .map(tuple -> {
                    Game game = tuple.get(0, Game.class);
                    Long userCount = tuple.get(1, Long.class);
                    return gameMapper.toDto(game, userCount);
                })
                .toList();

        // 페이징 메타데이터 구성
        Map<String, Object> result = new HashMap<>();
        result.put("nextCursor", nextCursor);
        result.put("hasNext", gameTuple.size() > 50);
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

        return gameMapper.toDto(savedGame, 0);
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
        long userCount = scoreboardRepository.countByGameId(savedGame.getId());

        return gameMapper.toDto(savedGame, userCount);
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

        Scoreboard scoreboard = new Scoreboard(game, user);
        scoreboardRepository.save(scoreboard);

        long userCount = scoreboardRepository.countByGameId(gameId);

        return gameMapper.toDto(game, userCount);
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
        long userCount = scoreboardRepository.countByGameId(gameId);

        return gameMapper.toDto(game, userCount);
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
}
