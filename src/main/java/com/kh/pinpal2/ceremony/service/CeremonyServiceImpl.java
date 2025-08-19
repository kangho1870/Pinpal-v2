package com.kh.pinpal2.ceremony.service;

import com.kh.pinpal2.ceremony.dto.CeremonyRespDto;
import com.kh.pinpal2.ceremony.entity.Ceremony;
import com.kh.pinpal2.ceremony.mapper.CeremonyMapper;
import com.kh.pinpal2.ceremony.repository.CeremonyRepository;
import com.kh.pinpal2.game.repository.GameRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CeremonyServiceImpl implements CeremonyService {

    private final CeremonyRepository ceremonyRepository;
    private final GameRepository gameRepository;
    private final CeremonyMapper ceremonyMapper;

    @Override
    @Transactional(readOnly = true)
    public List<CeremonyRespDto> getCeremoniesByClubId(Long clubId) {
        List<Long> gameIds = gameRepository.findIdsByClubId(clubId);
        
        if (gameIds.isEmpty()) {
            return List.of();
        }
        
        List<Ceremony> ceremonies = ceremonyRepository.findByGameIdInOrderByCreatedAtDesc(gameIds);
        return ceremonies.stream()
                .map(ceremonyMapper::toDto)
                .toList();
    }
}

