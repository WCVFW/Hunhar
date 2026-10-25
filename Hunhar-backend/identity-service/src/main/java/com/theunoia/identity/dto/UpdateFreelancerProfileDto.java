package com.theunoia.identity.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/** Partial update: null fields are left unchanged. */
@Data
public class UpdateFreelancerProfileDto {

    @Size(min = 2, max = 100, message = "Name must be 2-100 characters")
    private String fullName;

    @Pattern(regexp = "^[0-9]{10}$", message = "Mobile number must be 10 digits")
    private String mobile;

    @Size(max = 120)
    private String professionalTitle;

    @Size(max = 3000, message = "Bio can be at most 3000 characters")
    private String bio;

    @Size(max = 30, message = "At most 30 skills")
    private List<@NotBlank @Size(max = 50) String> skills;

    @Size(max = 120)
    private String location;

    @Size(max = 120)
    private String availability;

    @DecimalMin(value = "0", message = "Hourly rate cannot be negative")
    @DecimalMax(value = "100000", message = "Hourly rate is too high")
    private BigDecimal hourlyRate;

    @Min(0) @Max(60)
    private Integer experienceYears;

    @Size(max = 160)
    private String collegeUniversity;

    @Min(1950) @Max(2100)
    private Integer graduationYear;

    @Size(max = 160)
    private String degreeField;

    @Size(max = 255)
    private String portfolioUrl;

    @Size(max = 255)
    private String githubUrl;

    @Size(max = 500)
    private String avatarUrl;

    @Size(max = 500)
    private String coverUrl;
}
