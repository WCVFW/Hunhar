package com.theunoia.common.event;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Declarable;
import org.springframework.amqp.core.Declarables;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.ArrayList;
import java.util.List;

/**
 * RabbitMQ topology:
 * <pre>
 *  theunoia.events (topic) --[routing key = event type]--> {service}.events (durable queue)
 *  {service}.events --dead letter--> theunoia.events.dlx --> {service}.events.dlq
 * </pre>
 * Each service declares only its own queue; bindings come from {@code theunoia.events.subscriptions}.
 */
@Configuration
@EnableScheduling
@EnableConfigurationProperties(EventProperties.class)
public class EventConfig {

    public static final String EXCHANGE = "theunoia.events";
    public static final String DLX = "theunoia.events.dlx";

    @Bean
    public MessageConverter jacksonMessageConverter(ObjectMapper objectMapper) {
        return new Jackson2JsonMessageConverter(objectMapper);
    }

    @Bean
    public Declarables eventTopology(EventProperties props, @Value("${spring.application.name}") String serviceName) {
        List<Declarable> declarables = new ArrayList<>();
        TopicExchange exchange = new TopicExchange(EXCHANGE, true, false);
        TopicExchange dlx = new TopicExchange(DLX, true, false);
        declarables.add(exchange);
        declarables.add(dlx);

        if (!props.getSubscriptions().isEmpty()) {
            String queueName = serviceName + ".events";
            QueueBuilder builder = QueueBuilder.durable(queueName);
            if (props.isDeadLetterEnabled()) {
                builder.withArgument("x-dead-letter-exchange", DLX).withArgument("x-dead-letter-routing-key", queueName);
                Queue dlq = QueueBuilder.durable(queueName + ".dlq").build();
                declarables.add(dlq);
                declarables.add(BindingBuilder.bind(dlq).to(dlx).with(queueName));
            }
            Queue queue = builder.build();
            declarables.add(queue);
            for (String key : props.getSubscriptions()) {
                Binding binding = BindingBuilder.bind(queue).to(exchange).with(key);
                declarables.add(binding);
            }
        }
        return new Declarables(declarables);
    }
}
