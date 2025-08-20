package com.kh.pinpal2.ceremony.service;

import com.kh.pinpal2.ceremony.dto.CeremonyRespDto;

import java.util.List;
import java.util.Map;

public interface CeremonyService {
    Map<Long, List<CeremonyRespDto>> getCeremoniesByClubId(Long clubId);
}

