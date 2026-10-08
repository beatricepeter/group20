package com.egaz.visitors.repository;

import com.egaz.visitors.entity.Department;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DepartmentRepository extends JpaRepository<Department, String> {
    List<Department> findAllByOrderByNameAsc();
    Optional<Department> findByNameIgnoreCase(String name);
}
