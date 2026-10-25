package com.theunoia.engagement.integration;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class EmailSender {

    public void sendEmail(String to, String subject, String body) {
        log.info("Sending Email to: {} | Subject: {} | Body length: {}", to, subject, body.length());
    }
}
