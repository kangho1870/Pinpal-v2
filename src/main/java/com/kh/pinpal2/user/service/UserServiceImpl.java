package com.kh.pinpal2.user.service;

import com.kh.pinpal2.base.util.SecurityUtil;
import com.kh.pinpal2.user.dto.UserRespDto;
import com.kh.pinpal2.user.entity.User;
import com.kh.pinpal2.user.mapper.UserMapper;
import com.kh.pinpal2.user.repository.UserRepository;
import com.kh.pinpal2.user_club.dto.UserClubRespDto;
import com.kh.pinpal2.user_club.entity.UserClub;
import com.kh.pinpal2.user_club.mapper.UserClubMapper;
import com.kh.pinpal2.user_club.repository.UserClubRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserClubRepository userClubRepository;
    private final UserClubMapper userClubMapper;
    private final UserMapper userMapper;

    @Override
    @Transactional(readOnly = true)
    public List<UserClubRespDto> getMyClubs() {
        // 현재 인증된 사용자 정보 가져오기
        User user = SecurityUtil.getCurrentUser(userRepository);
        
        // 사용자가 가입한 모든 클럽 조회
        List<UserClub> userClubs = userClubRepository.findByUserId(user.getId());
        
        // UserClubRespDto로 변환하여 반환
        return userClubs.stream()
                .map(userClubMapper::toDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public UserRespDto getCurrentUser() {
        // 현재 인증된 사용자 정보 가져오기
        User user = SecurityUtil.getCurrentUser(userRepository);
        
        // UserRespDto로 변환하여 반환
        return userMapper.toDto(user);
    }
}
