package com.kh.pinpal2.game.mapper;

import com.kh.pinpal2.game.dto.GameRespDto;
import com.kh.pinpal2.game.entity.Game;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface GameMapper {

    GameRespDto toDto(Game game, long joinUserCount, List<Long> participantUserIds);
}
