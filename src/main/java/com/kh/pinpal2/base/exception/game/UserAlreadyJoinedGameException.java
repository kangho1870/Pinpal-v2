package com.kh.pinpal2.base.exception.game;

import com.kh.pinpal2.base.exception.BaseException;
import org.springframework.http.HttpStatus;

import java.time.Instant;

public class UserAlreadyJoinedGameException extends BaseException {

    @Override
    public Instant getTimestamp() {
        return Instant.now();
    }

    @Override
    public HttpStatus getHttpStatus() {
        return HttpStatus.BAD_REQUEST;
    }

    @Override
    public String getMessage() {
        return "이미 참여한 게임입니다.";
    }

    @Override
    public String getDetails() {
        return "이미 참여한 게임입니다.";
    }
}
