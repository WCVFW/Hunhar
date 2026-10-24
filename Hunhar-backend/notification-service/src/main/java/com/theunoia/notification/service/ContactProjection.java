package com.theunoia.notification.service;

import com.theunoia.notification.domain.NotificationEntities.UserContact;
import com.theunoia.notification.repository.NotificationRepositories.UserContactRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ContactProjection {

    private final UserContactRepository contacts;

    @Transactional
    public void upsert(UUID userId, String email, String mobile, String displayName, String role) {
        UserContact c = contacts.findById(userId).orElseGet(UserContact::new);
        c.setUserId(userId);
        if (email != null) c.setEmail(email);
        if (mobile != null) c.setMobile(mobile);
        if (displayName != null) c.setDisplayName(displayName);
        if (role != null) c.setRole(role);
        contacts.save(c);
    }
}
