package com.theunoia.common.event;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@ConfigurationProperties(prefix = "theunoia.events")
public class EventProperties {

    /** Routing keys (event types, wildcards allowed) this service consumes. */
    private List<String> subscriptions = new ArrayList<>();

    /** How often the outbox relay polls for unpublished events. */
    private long relayIntervalMs = 1000;

    /**
     * Route messages that exhausted their retries to {service}.events.dlq (RabbitMQ x-dead-letter-exchange).
     * Only disabled by the Docker-less local runner, whose embedded AMQP broker lacks that extension.
     */
    private boolean deadLetterEnabled = true;
}
