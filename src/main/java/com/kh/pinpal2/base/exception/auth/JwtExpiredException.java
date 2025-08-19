package com.kh.pinpal2.base.exception.auth;

import com.kh.pinpal2.base.exception.BaseException;
import org.springframework.http.HttpStatus;

import java.time.Instant;

public class JwtExpiredException extends BaseException {

    @Override
    public Instant getTimestamp() {
        return Instant.now();
    }

    @Override
    public HttpStatus getHttpStatus() {
        return HttpStatus.UNAUTHORIZED;
    }

    @Override
    public String getMessage() {
        return "토큰이 만료 되었습니다.";
    }

    @Override
    public String getDetails() {
        return "토큰이 만료 되었습니다. 다시 로그인 해주세요.";
    }
}
