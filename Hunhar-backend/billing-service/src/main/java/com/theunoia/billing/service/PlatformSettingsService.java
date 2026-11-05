package com.theunoia.billing.service;

import com.theunoia.billing.domain.PlatformSetting;
import com.theunoia.billing.repository.PlatformSettingRepository;
import com.theunoia.common.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.function.Predicate;

/**
 * Platform economics and rules the admin can change at runtime.
 * Other services read them through /internal/settings (see PlatformSettingsClient).
 */
@Service
@RequiredArgsConstructor
public class PlatformSettingsService {

    public static final String COMMISSION_PERCENT = "commissionPercent";
    public static final String CREDITS_PER_BID = "creditsPerBid";
    public static final String STARTER_CREDITS = "starterCredits";
    public static final String MIN_PAYOUT = "minPayout";
    public static final String KYC_REQUIRED_FOR_PAYOUT = "kycRequiredForPayout";
    public static final String AUTO_APPROVE_DAYS = "autoApproveDays";

    private record Rule(String defaultValue, Predicate<String> valid, String error) {}

    private static final Map<String, Rule> RULES = new LinkedHashMap<>();

    static {
        RULES.put(COMMISSION_PERCENT, new Rule("10", v -> isInt(v, 0, 50), "Commission must be between 0 and 50%"));
        RULES.put(CREDITS_PER_BID, new Rule("2", v -> isInt(v, 0, 50), "Credits per proposal must be between 0 and 50"));
        RULES.put(STARTER_CREDITS, new Rule("10", v -> isInt(v, 0, 1000), "Starter credits must be between 0 and 1000"));
        RULES.put(MIN_PAYOUT, new Rule("100", v -> isInt(v, 1, 100000), "Minimum withdrawal must be between ₹1 and ₹1,00,000"));
        RULES.put(KYC_REQUIRED_FOR_PAYOUT, new Rule("true", v -> v.equals("true") || v.equals("false"), "KYC rule must be true or false"));
        RULES.put(AUTO_APPROVE_DAYS, new Rule("7", v -> isInt(v, 0, 60), "Auto-approve days must be between 0 (off) and 60"));
    }

    private final PlatformSettingRepository repository;

    @Transactional(readOnly = true)
    public Map<String, String> getAll() {
        Map<String, String> values = new LinkedHashMap<>();
        RULES.forEach((k, r) -> values.put(k, r.defaultValue()));
        repository.findAll().forEach(s -> {
            if (RULES.containsKey(s.getKey())) values.put(s.getKey(), s.getValue());
        });
        return values;
    }

    @Transactional
    public Map<String, String> update(Map<String, Object> changes) {
        changes.forEach((key, raw) -> {
            Rule rule = RULES.get(key);
            if (rule == null) throw new BadRequestException("Unknown setting: " + key);
            String value = String.valueOf(raw).trim();
            if (!rule.valid().test(value)) throw new BadRequestException(rule.error());
            repository.save(PlatformSetting.builder().key(key).value(value).build());
        });
        return getAll();
    }

    public int getInt(String key) {
        return Integer.parseInt(getAll().get(key));
    }

    public boolean getBoolean(String key) {
        return Boolean.parseBoolean(getAll().get(key));
    }

    /** e.g. 10 -> 0.10 */
    public BigDecimal commissionRate() {
        return BigDecimal.valueOf(getInt(COMMISSION_PERCENT)).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
    }

    private static boolean isInt(String v, int min, int max) {
        try {
            int n = Integer.parseInt(v);
            return n >= min && n <= max;
        } catch (NumberFormatException e) {
            return false;
        }
    }
}
