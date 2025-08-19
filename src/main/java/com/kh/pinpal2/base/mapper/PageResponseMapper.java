package com.kh.pinpal2.base.mapper;

import com.kh.pinpal2.base.dto.PageResponse;
import org.mapstruct.Mapper;

import java.util.List;
import java.util.Map;

@Mapper(componentModel = "spring")
public interface PageResponseMapper {

    default <T>PageResponse<T> pageResponse(List<T> list, Map<String, Object> result) {
        return new PageResponse<>(
                list,
                result.get("nextCursor"),
                list.size(),
                (Boolean) result.get("hasNext"),
                (Long) result.get("totalElements")
        );
    }
}
