package com.theunoia.common.web;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

public final class Pagination {

    public static final int MAX_SIZE = 100;

    private Pagination() {
    }

    public static Pageable of(int page, int size, Sort sort) {
        return PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_SIZE), sort);
    }

    public static Pageable newestFirst(int page, int size) {
        return of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
    }
}
