package com.kh.pinpal2.base.exception;

import org.springframework.http.HttpStatus;

import java.time.Instant;


public record ErrorResponse(
        Instant timestamp,
        int status,
        String message,
        String details
) {

    public static ErrorResponse of(HttpStatus status, String details) {
        return new ErrorResponse(
                Instant.now(),
                status.value(),
                status.getReasonPhrase(),
                details
        );
    }
}