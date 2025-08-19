package com.kh.pinpal2.base.exception;

import org.springframework.http.HttpStatus;

import java.time.Instant;

public abstract class BaseException extends RuntimeException {

    public abstract Instant getTimestamp();
    public abstract HttpStatus getHttpStatus();
    public abstract String getMessage();
    public abstract String getDetails();
}
