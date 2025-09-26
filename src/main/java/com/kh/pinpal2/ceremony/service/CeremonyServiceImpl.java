package com.kh.pinpal2.ceremony.service;

import com.kh.pinpal2.ceremony.dto.CeremonyRespDto;
import com.kh.pinpal2.ceremony.entity.Ceremony;
import com.kh.pinpal2.ceremony.mapper.CeremonyMapper;
import com.kh.pinpal2.ceremony.repository.CeremonyRepository;
import com.kh.pinpal2.ceremony_user.entity.CeremonyUser;
import com.kh.pinpal2.ceremony_user.mapper.CeremonyUserMapper;
import com.kh.pinpal2.ceremony_user.repository.CeremonyUserRepository;
import com.kh.pinpal2.game.entity.Game;
import com.kh.pinpal2.game.repository.GameRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class CeremonyServiceImpl implements CeremonyService {

    private final CeremonyRepository ceremonyRepository;
    private final CeremonyUserRepository ceremonyUserRepository;
    private final GameRepository gameRepository;
    private final CeremonyMapper ceremonyMapper;
    private final CeremonyUserMapper ceremonyUserMapper;

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheNames = "recentCeremonies", key = "#clubId")
    public Map<Long, List<CeremonyRespDto>> getCeremoniesByClubId(Long clubId) {
        // 1. 클럽의 최근 5게임 조회 (ID 내림차순 정렬)
        List<Game> games = gameRepository.findRecentGamesByClubId(clubId, Limit.of(5));
        log.info("[CeremonyService] Ceremony 조회 : {}", games);
        
        // 디버깅: 조회된 게임들의 ID 확인
        log.info("=== 조회된 게임들의 ID ===");
        games.forEach(game -> {
            log.info("게임 ID: {}", game.getId());
        });

        Map<Long, List<CeremonyRespDto>> result = new HashMap<>();

        // 2. 최근 5게임의 Ceremony 조회
        games.forEach(game -> {
            log.info("=== 게임 ID: {} ===", game.getId());
            
            // 원래 쿼리
            List<Object[]> ceremonySummary = ceremonyRepository.getCeremonySummaryByGameId(game.getId());
            log.info("ceremonySummary Size = {}", ceremonySummary.size());
            
            if (ceremonySummary.isEmpty()) {
                log.info("게임 ID {}에 대한 ceremony 데이터가 없습니다.", game.getId());
                return; // ceremony가 없으면 건너뛰기
            }
            
            List<CeremonyRespDto> ceremonyUsers = new ArrayList<>();

            for(Object[] row : ceremonySummary) {
                log.info("ceremonySummary row: {}",  Arrays.toString(row));
                String type = (String) row[0];

                // array_agg 결과가 String[] 배열로 반환됨
                if (row[1] instanceof String[]) {
                    String[] winners = (String[]) row[1];
                    ceremonyUsers.add(new CeremonyRespDto(type, Arrays.asList(winners)));
                } else {
                    log.warn("예상하지 못한 타입: {}", row[1].getClass().getName());
                }
            }
            result.put(game.getId(), ceremonyUsers);
        });

        return result;
    }
}

