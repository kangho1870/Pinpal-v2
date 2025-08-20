package com.kh.pinpal2.ceremony.mapper;

import com.kh.pinpal2.ceremony.dto.CeremonyRespDto;
import com.kh.pinpal2.ceremony.entity.Ceremony;

import com.kh.pinpal2.ceremony_user.dto.CeremonyUserRespDto;
import com.kh.pinpal2.ceremony_user.mapper.CeremonyUserMapper;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring", uses = {CeremonyUserMapper.class})
public interface CeremonyMapper {
    

}

