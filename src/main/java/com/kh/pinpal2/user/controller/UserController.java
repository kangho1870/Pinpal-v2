package com.kh.pinpal2.user.controller;

import com.kh.pinpal2.user.dto.UserRespDto;
import com.kh.pinpal2.user_club.dto.UserClubRespDto;
import com.kh.pinpal2.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    @GetMapping("/my-clubs")
    public ResponseEntity<List<UserClubRespDto>> getMyClubs() {
        List<UserClubRespDto> response = userService.getMyClubs();
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @GetMapping("/me")
    public ResponseEntity<UserRespDto> getCurrentUser() {
        UserRespDto response = userService.getCurrentUser();
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }
}
