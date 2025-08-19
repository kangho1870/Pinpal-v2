package com.kh.pinpal2.ceremony.service;

import com.kh.pinpal2.ceremony.dto.CeremonyRespDto;

import java.util.List;

public interface CeremonyService {
    List<CeremonyRespDto> getCeremoniesByClubId(Long clubId);
}

