package com.theunoia.payment.service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Platform payments: "Platform commission is deducted before freelancer payout."
 * commission = gross x rate, GST (18%) is charged on the commission, freelancer receives the rest.
 */
public final class CommissionCalculator {

    private CommissionCalculator() {
    }

    public record Breakdown(BigDecimal gross, BigDecimal commission, BigDecimal gst, BigDecimal net) {
    }

    public static Breakdown compute(BigDecimal gross, BigDecimal rate, BigDecimal gstRate) {
        BigDecimal g = gross.setScale(2, RoundingMode.HALF_UP);
        BigDecimal commission = g.multiply(rate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal gst = commission.multiply(gstRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal net = g.subtract(commission).subtract(gst);
        if (net.signum() < 0) throw new IllegalArgumentException("Commission exceeds gross amount");
        return new Breakdown(g, commission, gst, net);
    }
}
