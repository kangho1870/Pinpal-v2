package com.kh.pinpal2.club.mapper;

import com.kh.pinpal2.club.dto.ClubRespDto;
import com.kh.pinpal2.club.entity.Club;
import com.kh.pinpal2.user.mapper.UserMapper;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring", uses = {UserMapper.class})
public interface ClubMapper {

    ClubRespDto toDto(Club club);
}
