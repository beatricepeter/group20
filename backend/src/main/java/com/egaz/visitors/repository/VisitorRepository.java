package com.egaz.visitors.repository;

import com.egaz.visitors.entity.Visitor;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VisitorRepository extends JpaRepository<Visitor, String> {
    List<Visitor> findAllByOrderByCheckInDateDesc();
    List<Visitor> findByExpert_IdOrderByCheckInDateDesc(String expertId);
    List<Visitor> findByCheckOutDateIsNullOrderByCheckInDateDesc();
    List<Visitor> findByCheckInDateBetweenOrderByCheckInDateDesc(LocalDateTime from, LocalDateTime to);
    Optional<Visitor> findFirstByIdNumberIgnoreCaseOrderByCheckInDateDesc(String idNumber);
    long countByExpert_Id(String expertId);
}
