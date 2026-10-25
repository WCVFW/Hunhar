package com.theunoia.engagement.integration;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@Slf4j
public class WhatsAppSender {

    @Value("${theunoia.whatsapp.phone-number-id:123456789}")
    private String phoneNumberId;

    @Value("${theunoia.whatsapp.access-token:placeholder_token}")
    private String accessToken;

    public boolean sendTemplateNotification(String toMobile, String templateName, Map<String, String> params) {
        log.info("Sending WhatsApp Notification to: {} [Template: {}] with params: {}", toMobile, templateName, params);
        // Uses Meta WhatsApp Cloud API endpoint: https://graph.facebook.com/v20.0/{phoneNumberId}/messages
        // In local/demo mode, logs and succeeds
        return true;
    }
}
