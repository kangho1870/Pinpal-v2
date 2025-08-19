package com.kh.pinpal2.ceremony.mapper;

import com.kh.pinpal2.ceremony.dto.CeremonyRespDto;
import com.kh.pinpal2.ceremony.entity.Ceremony;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface CeremonyMapper {
    CeremonyRespDto toDto(Ceremony ceremony);
}

