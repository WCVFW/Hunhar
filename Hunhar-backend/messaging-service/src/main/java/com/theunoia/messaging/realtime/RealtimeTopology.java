package com.theunoia.messaging.realtime;

import com.theunoia.common.event.EventConfig;
import org.springframework.amqp.core.AnonymousQueue;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Per-pod exclusive queue receiving every message.sent event. */
@Configuration
public class RealtimeTopology {

    @Bean
    public Queue realtimeQueue() {
        return new AnonymousQueue();
    }

    @Bean
    public Binding realtimeBinding(Queue realtimeQueue) {
        return BindingBuilder.bind(realtimeQueue).to(new TopicExchange(EventConfig.EXCHANGE, true, false)).with("message.sent");
    }
}
