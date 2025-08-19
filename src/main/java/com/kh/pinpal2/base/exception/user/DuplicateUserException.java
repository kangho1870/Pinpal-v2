package com.kh.pinpal2.base.exception.user;

import com.kh.pinpal2.base.exception.BaseException;
import org.springframework.http.HttpStatus;

import java.time.Instant;

public class DuplicateUserException extends BaseException {

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
        return "이미 존재하는 이메일입니다.";
    }

    @Override
    public String getDetails() {
        return "이미 존재하는 이메일입니다. 다시 입력해주세요.";
    }
}
