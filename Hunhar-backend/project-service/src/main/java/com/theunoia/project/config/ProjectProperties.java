package com.theunoia.project.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@ConfigurationProperties(prefix = "theunoia.projects")
public class ProjectProperties {

    /** Credit cost per bid by project budget, evaluated in ascending order. */
    private List<CreditTier> creditTiers = new ArrayList<>();
    private int maxCreditCost = 8;
    private int maxTeamSize = 10;

    @Getter
    @Setter
    public static class CreditTier {
        private BigDecimal upTo;
        private int credits;
    }
}
