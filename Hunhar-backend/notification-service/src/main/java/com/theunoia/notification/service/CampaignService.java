package com.theunoia.notification.service;

import com.theunoia.notification.channel.WhatsAppSender;
import com.theunoia.notification.domain.NotificationEntities.Campaign;
import com.theunoia.notification.domain.NotificationEntities.UserContact;
import com.theunoia.notification.repository.NotificationRepositories.CampaignRepository;
import com.theunoia.notification.repository.NotificationRepositories.UserContactRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** WhatsApp promotional campaigns - only to users who opted in to marketing messages. */
@Service
@RequiredArgsConstructor
public class CampaignService {

    private final CampaignRepository campaigns;
    private final UserContactRepository contacts;
    private final WhatsAppSender whatsapp;

    @Transactional
    public Campaign send(UUID adminId, String name, String template, String audience, String message) {
        List<UserContact> targets = contacts.marketingAudience(audience);
        Campaign c = new Campaign();
        c.setName(name);
        c.setTemplateName(template);
        c.setAudience(audience);
        c.setMessage(message);
        c.setCreatedBy(adminId);
        c.setTargetCount(targets.size());
        campaigns.save(c);
        int sent = 0;
        for (UserContact u : targets) {
            whatsapp.sendTemplate(u.getUserId(), u.getMobile(), template,
                    List.of(u.getDisplayName() == null ? "there" : u.getDisplayName(), message));
            sent++;
        }
        c.setSentCount(sent);
        c.setStatus("COMPLETED");
        c.setSentAt(Instant.now());
        return c;
    }

    @Transactional(readOnly = true)
    public List<Campaign> list() {
        return campaigns.findAll(org.springframework.data.domain.Sort.by("createdAt").descending());
    }
}
