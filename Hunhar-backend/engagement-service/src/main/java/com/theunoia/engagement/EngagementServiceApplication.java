package com.theunoia.engagement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@ComponentScan(basePackages = {"com.theunoia.common", "com.theunoia.engagement"})
public class EngagementServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(EngagementServiceApplication.class, args);
    }
}
