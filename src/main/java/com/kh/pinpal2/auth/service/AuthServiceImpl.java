package com.kh.pinpal2.auth.service;

import com.kh.pinpal2.auth.dto.SignUpReqDto;
import com.kh.pinpal2.base.exception.user.DuplicateUserException;
import com.kh.pinpal2.user.entity.User;
import com.kh.pinpal2.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;

    @Override
    public void signUp(SignUpReqDto signUpReqDto) {
        if (userRepository.existsByEmail(signUpReqDto.getEmail())) {
            throw new DuplicateUserException();
        }

        User user = new User(signUpReqDto);
        userRepository.save(user);
    }

    @Override
    public void idCheck(String email) {
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateUserException();
        }
    }
}
