package com.theunoia.common.exception;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(Instant timestamp, int status, String code, String message, String path, Object details) {

    public static ErrorResponse of(int status, String code, String message, String path, Object details) {
        return new ErrorResponse(Instant.now(), status, code, message, path, details);
    }
}
