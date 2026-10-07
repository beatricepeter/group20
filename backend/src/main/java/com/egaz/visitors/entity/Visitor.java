package com.egaz.visitors.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Inalingana na jedwali `visitors` kwenye visitors_db.
 * `expertId` sasa ni relationship (@ManyToOne) kuelekea Expert, ikitumia
 * column `expertId` kama foreign key (japo SQL dump asili haina constraint
 * ya FK, JPA/Hibernate itaitendea kama FK ya kimantiki).
 */
@Entity
@Table(name = "visitors")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Visitor {

    @Id
    @Column(name = "id", length = 64, nullable = false)
    private String id;

    @Column(name = "fullName", length = 255, nullable = false)
    private String fullName;

    @Column(name = "firstName", length = 120)
    private String firstName;

    @Column(name = "lastName", length = 120)
    private String lastName;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "phone", length = 50, nullable = false)
    private String phone;

    @Column(name = "company", length = 255)
    private String company;

    @Column(name = "idType", length = 100)
    private String idType;

    @Column(name = "idNumber", length = 255)
    private String idNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expertId", referencedColumnName = "id")
    private Expert expert;

    @Column(name = "personToVisit", length = 255)
    private String personToVisit;

    @Column(name = "purpose", length = 255, nullable = false)
    private String purpose;

    @Column(name = "recordedBy", length = 255)
    private String recordedBy;

    @Column(name = "checkInDate", nullable = false)
    private LocalDateTime checkInDate;

    @Column(name = "checkOutDate")
    private LocalDateTime checkOutDate;

    @Column(name = "checkoutReference", length = 255)
    private String checkoutReference;
}
