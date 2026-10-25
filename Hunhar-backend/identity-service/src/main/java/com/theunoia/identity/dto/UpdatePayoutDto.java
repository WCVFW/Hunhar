package com.theunoia.identity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdatePayoutDto {

    @NotBlank(message = "Payout method is required")
    @Pattern(regexp = "^(UPI|BANK)$", message = "Payout method must be UPI or BANK")
    private String method;

    @Pattern(regexp = "^$|^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$", message = "Invalid UPI ID (example: name@okhdfcbank)")
    private String upiId;

    @Size(max = 120)
    private String accountHolder;

    @Size(max = 120)
    private String bankName;

    /** Leave empty to keep the saved account number. */
    @Pattern(regexp = "^$|^[0-9]{9,18}$", message = "Account number must be 9-18 digits")
    private String accountNumber;

    @Pattern(regexp = "^$|^[A-Z]{4}0[A-Z0-9]{6}$", message = "Invalid IFSC code (example: HDFC0001234)")
    private String ifscCode;

    /** Leave empty to keep the saved PAN. */
    @Pattern(regexp = "^$|^[A-Z]{5}[0-9]{4}[A-Z]$", message = "Invalid PAN (example: ABCDE1234F)")
    private String panNumber;

    private boolean autoWithdrawal;
}
