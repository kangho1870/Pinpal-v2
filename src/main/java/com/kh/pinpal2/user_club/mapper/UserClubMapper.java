package com.kh.pinpal2.user_club.mapper;

import com.kh.pinpal2.user_club.dto.UserClubRespDto;
import com.kh.pinpal2.user_club.entity.UserClub;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserClubMapper {

    UserClubRespDto toDto(UserClub userClub);
}
