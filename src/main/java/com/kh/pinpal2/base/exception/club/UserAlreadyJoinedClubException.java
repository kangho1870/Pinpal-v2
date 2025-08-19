package com.kh.pinpal2.base.exception.club;

import com.kh.pinpal2.base.exception.BaseException;
import org.springframework.http.HttpStatus;

import java.time.Instant;

public class UserAlreadyJoinedClubException extends BaseException {

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
        return "이미 가입한 클럽입니다.";
    }

    @Override
    public String getDetails() {
        return "이미 가입한 클럽입니다.";
    }
}
