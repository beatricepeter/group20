package com.egaz.visitors.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalTime;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "system_settings")
@Data
@NoArgsConstructor
public class SystemSettings {
    @Id
    @Column(length = 32, nullable = false)
    private String id;

    @Column(name = "autoCheckoutTime", nullable = false)
    private LocalTime autoCheckoutTime;
}
