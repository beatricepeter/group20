package com.egaz.visitors.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "departments")
@Data
@NoArgsConstructor
public class Department {
    @Id
    @Column(length = 36, nullable = false)
    private String id;

    @Column(name = "name", length = 255, nullable = false, unique = true)
    private String name;
}
