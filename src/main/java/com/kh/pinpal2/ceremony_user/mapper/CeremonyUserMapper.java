package com.kh.pinpal2.ceremony_user.mapper;

import com.kh.pinpal2.ceremony_user.dto.CeremonyUserRespDto;
import com.kh.pinpal2.ceremony_user.entity.CeremonyUser;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = {com.kh.pinpal2.user.mapper.UserMapper.class})
public interface CeremonyUserMapper {
    
    @Mapping(target = "user", source = "user")
    @Mapping(target = "ceremonyId", source = "ceremony.id")
    CeremonyUserRespDto toDto(CeremonyUser ceremonyUser);
}
