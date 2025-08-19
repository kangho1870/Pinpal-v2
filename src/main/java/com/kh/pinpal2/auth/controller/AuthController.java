package com.kh.pinpal2.auth.controller;

import com.kh.pinpal2.auth.dto.IdCheckReqDto;
import com.kh.pinpal2.auth.dto.SignUpReqDto;
import com.kh.pinpal2.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/sign-up")
    public ResponseEntity<Void> registerUser(@Valid @RequestBody SignUpReqDto signUpReqDto) {
        authService.signUp(signUpReqDto);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

//    @GetMapping("/sign-in")
//    public ResponseEntity<SignInRespDto> login(@Valid @)
    @PostMapping("/id-check")
    public ResponseEntity<Void> idCheck(@RequestBody IdCheckReqDto idCheckReqDto) {
        authService.idCheck(idCheckReqDto.userEmail());
        return ResponseEntity.status(HttpStatus.OK).build();
    }
}
