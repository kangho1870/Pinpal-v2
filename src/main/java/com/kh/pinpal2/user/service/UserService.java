package com.kh.pinpal2.user.service;

import com.kh.pinpal2.user.dto.UserRespDto;
import com.kh.pinpal2.user_club.dto.UserClubRespDto;

import java.util.List;

public interface UserService {
    
    /**
     * 현재 로그인한 사용자가 가입한 클럽 목록을 조회합니다.
     * @return 사용자가 가입한 클럽 목록
     */
    List<UserClubRespDto> getMyClubs();
    
    /**
     * 현재 로그인한 사용자 정보를 조회합니다.
     * @return 현재 사용자 정보
     */
    UserRespDto getCurrentUser();
}
