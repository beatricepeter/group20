package com.egaz.visitors.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.egaz.visitors.dto.DepartmentRequest;
import com.egaz.visitors.entity.Department;
import com.egaz.visitors.exception.ConflictException;
import com.egaz.visitors.repository.DepartmentRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DepartmentServiceTest {

    @Mock
    private DepartmentRepository repository;

    @Test
    void createTrimsAndPersistsDepartmentName() {
        when(repository.findByNameIgnoreCase("Human Resources")).thenReturn(Optional.empty());
        when(repository.save(any(Department.class))).thenAnswer(invocation -> invocation.getArgument(0));
        DepartmentService service = new DepartmentService(repository);

        var created = service.create(new DepartmentRequest("  Human Resources  "));

        assertEquals("Human Resources", created.name());
        verify(repository).save(any(Department.class));
    }

    @Test
    void createRejectsDuplicateDepartmentIgnoringCase() {
        Department existing = new Department();
        existing.setName("Human Resources");
        when(repository.findByNameIgnoreCase("HUMAN RESOURCES")).thenReturn(Optional.of(existing));
        DepartmentService service = new DepartmentService(repository);

        assertThrows(
            ConflictException.class,
            () -> service.create(new DepartmentRequest("HUMAN RESOURCES"))
        );
    }

    @Test
    void createRejectsBlankDepartmentName() {
        DepartmentService service = new DepartmentService(repository);

        assertThrows(
            IllegalArgumentException.class,
            () -> service.create(new DepartmentRequest("  "))
        );
    }
}
