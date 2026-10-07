package com.egaz.visitors.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.util.List;
import java.util.HashSet;
import java.util.Set;

/**
 * Inalingana na jedwali `experts` kwenye visitors_db.
 */
@Entity
@Table(name = "experts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Expert {

    @Id
    @Column(name = "id", length = 64, nullable = false)
    private String id;

    @Column(name = "fullname", length = 255, nullable = false)
    private String fullname;

    @Column(name = "department", length = 255)
    private String department;

    @Column(name = "username", length = 100, unique = true)
    private String username;

    @Column(name = "password", length = 255)
    private String password;

    @Column(name = "can_delete_visitors", nullable = false)
    private boolean canDeleteVisitors = false;

    @ElementCollection
    @CollectionTable(name = "expert_permissions", joinColumns = @JoinColumn(name = "expert_id"))
    @Column(name = "permission", nullable = false, length = 100)
    private Set<String> permissions = new HashSet<>();

    // Upande wa "1" wa relationship: mtaalamu mmoja anaweza kuwa na visitors wengi.
    // mappedBy="expert" inarejea field "expert" iliyopo kwenye Visitor.java.
    @OneToMany(mappedBy = "expert")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Visitor> visitors;
}
