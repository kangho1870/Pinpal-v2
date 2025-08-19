package com.kh.pinpal2.auth.service;

import com.kh.pinpal2.auth.dto.SignUpReqDto;

public interface AuthService {
    void signUp(SignUpReqDto signUpReqDto);
    void idCheck(String email);
}
