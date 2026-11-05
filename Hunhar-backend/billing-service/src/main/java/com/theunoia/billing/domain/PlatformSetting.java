package com.theunoia.billing.domain;

import com.theunoia.common.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

/** One admin-editable platform setting (key/value). */
@Entity
@Table(name = "platform_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlatformSetting extends BaseEntity {

    @Id
    @Column(name = "setting_key", length = 60)
    private String key;

    @Column(name = "setting_value", nullable = false, length = 255)
    private String value;
}
