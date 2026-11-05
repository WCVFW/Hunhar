package com.theunoia.project;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@org.springframework.scheduling.annotation.EnableScheduling
@ComponentScan(basePackages = {"com.theunoia.common", "com.theunoia.project"})
public class ProjectServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(ProjectServiceApplication.class, args);
    }
}
