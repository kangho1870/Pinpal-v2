package com.kh.pinpal2.base.exception.scoreboard;

import com.kh.pinpal2.base.exception.BaseException;
import org.springframework.http.HttpStatus;

import java.time.Instant;

public class ScoreboardNotFoundException extends BaseException {
    @Override
    public Instant getTimestamp() {
        return Instant.now();
    }

    @Override
    public HttpStatus getHttpStatus() {
        return HttpStatus.NOT_FOUND;
    }

    @Override
    public String getMessage() {
        return "존재하지 않는 정보 입니다.";
    }

    @Override
    public String getDetails() {
        return "존재하지 않는 scoreboard입니다.";
    }
}
