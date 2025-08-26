package com.kh.pinpal2.club.service;

import com.kh.pinpal2.base.dto.PageResponse;
import com.kh.pinpal2.base.exception.PermissionDeniedException;
import com.kh.pinpal2.base.exception.club.ClubNotFoundException;
import com.kh.pinpal2.base.exception.club.UserAlreadyJoinedClubException;
import com.kh.pinpal2.base.exception.user.UserNotFoundException;
import com.kh.pinpal2.base.mapper.PageResponseMapper;
import com.kh.pinpal2.base.util.SecurityUtil;
import com.kh.pinpal2.ceremony.repository.CeremonyRepository;
import com.kh.pinpal2.ceremony_user.repository.CeremonyUserRepository;
import com.kh.pinpal2.club.dto.ClubCreateDto;
import com.kh.pinpal2.club.dto.ClubRespDto;
import com.kh.pinpal2.club.dto.ClubUpdateDto;
import com.kh.pinpal2.club.entity.Club;
import com.kh.pinpal2.club.mapper.ClubMapper;
import com.kh.pinpal2.club.repository.ClubRepository;
import com.kh.pinpal2.game.repository.GameRepository;
import com.kh.pinpal2.scoreboard.repository.ScoreboardRepository;
import com.kh.pinpal2.user.entity.User;
import com.kh.pinpal2.user.repository.UserRepository;
import com.kh.pinpal2.user_club.dto.UserClubAvgUpdateReqDto;
import com.kh.pinpal2.user_club.dto.UserClubRoleUpdateReqDto;
import com.kh.pinpal2.user_club.entity.ClubRole;
import com.kh.pinpal2.user_club.mapper.UserClubMapper;
import com.kh.pinpal2.user_club.dto.UserClubRespDto;
import com.kh.pinpal2.user_club.entity.UserClub;
import com.kh.pinpal2.user_club.repository.UserClubRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ClubServiceImpl implements ClubService {

    private final UserRepository userRepository;
    private final ClubRepository clubRepository;
    private final GameRepository gameRepository;
    private final UserClubRepository userClubRepository;
    private final ScoreboardRepository  scoreboardRepository;
    private final CeremonyRepository ceremonyRepository;
    private final CeremonyUserRepository ceremonyUserRepository;
    private final ClubMapper clubMapper;
    private final UserClubMapper userClubMapper;
    private final PageResponseMapper  pageResponseMapper;

    @Override
    @Transactional
    public ClubRespDto register(ClubCreateDto clubCreateDto) {
        // 현재 인증된 사용자 정보 가져오기
        User user = SecurityUtil.getCurrentUser(userRepository);

        Club club = new Club(clubCreateDto, user);
        Club savedClub = clubRepository.save(club);

        UserClub userClub = new UserClub(user, savedClub, ClubRole.MASTER);
        userClubRepository.save(userClub);

        return clubMapper.toDto(savedClub);
    }

    @Override
    @Transactional
    public ClubRespDto updateClub(Long clubId, ClubUpdateDto clubUpdateDto) {
        Club club = clubRepository.findById(clubId).orElseThrow(
                ClubNotFoundException::new
        );

        User user = SecurityUtil.getCurrentUser(userRepository);

        if (!user.getId().equals(club.getOwner().getId())) {
            throw new PermissionDeniedException();
        }

        club.update(clubUpdateDto);
        Club savedClub = clubRepository.save(club);

        return clubMapper.toDto(savedClub);
    }

    @Override
    @Transactional
    public UserClubRespDto joinClub(Long clubId) {
        // 현재 인증된 사용자 정보 가져오기
        User user = SecurityUtil.getCurrentUser(userRepository);

        Club club = clubRepository.findById(clubId).orElseThrow(
                ClubNotFoundException::new
        );
        
        // 중복 가입 체크
        if (userClubRepository.existsByUserIdAndClubId(user.getId(), club.getId())) {
            throw new UserAlreadyJoinedClubException();
        }

        UserClub userClub = new UserClub(user, club);
        
        UserClub savedUserClub = userClubRepository.save(userClub);
        
        return userClubMapper.toDto(savedUserClub);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ClubRespDto> getAllClubs(Instant cursor, Integer page) {
        // cursor가 있으면 cursor 기반 페이지네이션, 없으면 page 기반 페이지네이션
        List<Club> clubs;
        if (cursor != null) {
            clubs = clubRepository.getAllClubs(cursor, 50);
        } else {
            // page 기반 페이지네이션 (기본값: 1페이지, 페이지당 50개)
            int pageSize = 50;
            int offset = (page - 1) * pageSize;
            clubs = clubRepository.getAllClubsByPage(offset, pageSize);
        }

        List<Club> content = clubs.size() > 50 ? clubs.subList(0, 50) : clubs;

        Instant nextCursor = content.isEmpty() ? null : content.get(content.size() -1).getCreatedAt();

        long totalElements = cursor != null ? clubRepository.countByCursor(cursor) : clubRepository.count();

        Map<String, Object> result = new HashMap<>();

        result.put("nextCursor", nextCursor);
        result.put("hasNext", clubs.size() > 50);
        result.put("totalElements", totalElements);
        result.put("currentPage", page);

        List<ClubRespDto> list = content.stream()
                .map(clubMapper::toDto).toList();

        return pageResponseMapper.pageResponse(list, result);
    }

    @Override
    @Transactional(readOnly = true)
    public ClubRespDto getClubById(Long clubId) {
        Club club = clubRepository.findById(clubId).orElseThrow(
                ClubNotFoundException::new
        );
        return clubMapper.toDto(club);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserClubRespDto> getClubMembers(Long clubId) {
        List<UserClub> userClubs = userClubRepository.findByClubId(clubId);
        return userClubs.stream()
                .map(userClubMapper::toDto)
                .toList();
    }

    @Override
    @Transactional
    public void delete(Long clubId) {
        Club club = clubRepository.findById(clubId).orElseThrow(
                ClubNotFoundException::new
        );

        User user = SecurityUtil.getCurrentUser(userRepository);

        if (!user.getId().equals(club.getOwner().getId())) {
            throw new PermissionDeniedException();
        }

        // 1. Game ID 목록 조회
        List<Long> gameIds = gameRepository.findIdsByClubId(clubId);

        if (!gameIds.isEmpty()) {
            // 2. Ceremony ID 목록 조회 후 CeremonyUser 벌크 삭제
            List<Long> ceremonyIds = ceremonyRepository.findIdsByGameIds(gameIds);
            if (!ceremonyIds.isEmpty()) {
                ceremonyUserRepository.deleteByCeremonyIds(ceremonyIds);
            }

            // 3. Ceremony 벌크 삭제
            ceremonyRepository.deleteByGameIds(gameIds);

            // 4. Scoreboard 벌크 삭제
            scoreboardRepository.deleteByGameIds(gameIds);

            // 5. Game 벌크 삭제
            gameRepository.deleteByClubId(clubId);
        }

        // 6. UserClub 벌크 삭제
        userClubRepository.deleteByClubId(clubId);

        // 7. Club 삭제
        clubRepository.deleteById(clubId);
    }

    @Override
    public List<UserClubRespDto> updateAvgAndGradeByMembers(Long clubId, UserClubAvgUpdateReqDto userClubAvgUpdateReqDto) {
        Club club = clubRepository.findById(clubId).orElseThrow(ClubNotFoundException::new);

        List<UserClub> users = userClubRepository.findAllByClubIdAndUserIdIn(clubId, userClubAvgUpdateReqDto.ids());

        Map<Long, Integer> userAvgMap = new HashMap<>();
        Map<Long, Integer> userGradeMap = new HashMap<>();

        for (int i = 0; i < userClubAvgUpdateReqDto.ids().size(); i++) {
            userAvgMap.put(userClubAvgUpdateReqDto.ids().get(i), userClubAvgUpdateReqDto.averages().get(i));
            userGradeMap.put(userClubAvgUpdateReqDto.ids().get(i), userClubAvgUpdateReqDto.grades().get(i));
        }

        users.forEach(user -> {
            Long userId = user.getUser().getId();

            if (userAvgMap.containsKey(userId)) {
                user.updateAvg(userAvgMap.get(userId));
            }

            if (userGradeMap.containsKey(userId)) {
                user.updateGrade(userGradeMap.get(userId));
            }
        });

        List<UserClub> saved = userClubRepository.saveAll(users);

        return saved.stream()
                .map(userClubMapper::toDto)
                .toList();
    }

    @Override
    public void updateRoleByMember(Long clubId, UserClubRoleUpdateReqDto userClubRoleUpdateReqDto) {
        Club club = clubRepository.findById(clubId).orElseThrow(ClubNotFoundException::new);

        UserClub user = userClubRepository.findByClubIdAndUserId(clubId, userClubRoleUpdateReqDto.memberId()).orElseThrow(UserNotFoundException::new);

        user.updateRole(userClubRoleUpdateReqDto.role());
        userClubRepository.save(user);
    }
}
