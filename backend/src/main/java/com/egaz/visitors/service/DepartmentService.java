package com.egaz.visitors.service;

import com.egaz.visitors.dto.DepartmentRequest;
import com.egaz.visitors.dto.DepartmentResponse;
import com.egaz.visitors.entity.Department;
import com.egaz.visitors.exception.ConflictException;
import com.egaz.visitors.exception.ResourceNotFoundException;
import com.egaz.visitors.repository.DepartmentRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class DepartmentService {
    private final DepartmentRepository repository;

    public DepartmentService(DepartmentRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<DepartmentResponse> findAll() {
        return repository.findAllByOrderByNameAsc().stream().map(this::toResponse).toList();
    }

    public DepartmentResponse create(DepartmentRequest request) {
        if (request == null || request.name() == null || request.name().isBlank()) {
            throw new IllegalArgumentException("Department name is required");
        }

        String name = request.name().trim();
        if (repository.findByNameIgnoreCase(name).isPresent()) {
            throw new ConflictException("Department already exists: " + name);
        }

        Department department = new Department();
        department.setId(UUID.randomUUID().toString());
        department.setName(name);
        return toResponse(repository.save(department));
    }

    public void delete(String id) {
        Department department = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Department not found: " + id));
        repository.delete(department);
    }

    private DepartmentResponse toResponse(Department department) {
        return new DepartmentResponse(department.getId(), department.getName());
    }
}
