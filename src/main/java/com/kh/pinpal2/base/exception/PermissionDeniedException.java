package com.kh.pinpal2.base.exception;

import org.springframework.http.HttpStatus;

import java.time.Instant;

public class PermissionDeniedException extends BaseException {

    @Override
    public Instant getTimestamp() {
        return Instant.now();
    }

    @Override
    public HttpStatus getHttpStatus() {
        return HttpStatus.FORBIDDEN;
    }

    @Override
    public String getMessage() {
        return "권한이 없습니다.";
    }

    @Override
    public String getDetails() {
        return "요청을 수행할 권한이 없습니다.";
    }
}
