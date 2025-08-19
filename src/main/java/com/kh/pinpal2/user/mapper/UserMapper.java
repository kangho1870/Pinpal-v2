package com.kh.pinpal2.user.mapper;

import com.kh.pinpal2.user.dto.UserRespDto;
import com.kh.pinpal2.user.entity.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {

    UserRespDto toDto(User user);
}
