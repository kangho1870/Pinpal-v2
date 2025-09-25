package com.kh.pinpal2.base.exception;

import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import lombok.extern.slf4j.Slf4j;

import java.util.stream.Collectors;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(BaseException.class)
    public ResponseEntity<ErrorResponse> handleBaseException(BaseException ex) {
        return ResponseEntity.status(ex.getHttpStatus())
                .body(ErrorResponse.of(ex.getHttpStatus(), ex.getDetails()));
    }

    // @Validation
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolationException(ConstraintViolationException ex) {
        String detailMessage = ex.getConstraintViolations().stream()
            .map(v -> v.getPropertyPath() + ": " + v.getMessage())
            .collect(Collectors.joining(", "));

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ErrorResponse.of(HttpStatus.BAD_REQUEST, detailMessage));
    }

    // @Valid
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValidException(MethodArgumentNotValidException ex) {
        String detailMessage = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> e.getField() + ": " + e.getDefaultMessage())
            .collect(Collectors.joining(", "));

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ErrorResponse.of(HttpStatus.BAD_REQUEST, detailMessage));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatchException(MethodArgumentTypeMismatchException ex) {
        String detailMessage = String.format("잘못된 파라미터 형식입니다.");

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ErrorResponse.of(HttpStatus.BAD_REQUEST, detailMessage));
    }

    // WebSocket 관련 예외 처리
    @ExceptionHandler(MessageDeliveryException.class)
    public void handleMessageDeliveryException(MessageDeliveryException ex) {
        // WebSocket 연결 종료 시 발생하는 예외는 로그 레벨을 낮춤
        if (ex.getCause() instanceof AccessDeniedException) {
            log.debug("WebSocket 연결 종료 시 인증 예외 (정상적인 동작): {}", ex.getMessage());
        } else {
            log.warn("WebSocket 메시지 전송 실패: {}", ex.getMessage());
        }
    }

    @ExceptionHandler(AccessDeniedException.class)
    public void handleAccessDeniedException(AccessDeniedException ex) {
        // WebSocket 관련 AccessDeniedException은 로그 레벨을 낮춤
        log.debug("WebSocket 인증 실패 (정상적인 동작): {}", ex.getMessage());
    }
}

