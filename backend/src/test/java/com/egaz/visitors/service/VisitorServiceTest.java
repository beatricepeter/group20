package com.egaz.visitors.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.egaz.visitors.dto.CheckoutRequest;
import com.egaz.visitors.dto.VisitorRequest;
import com.egaz.visitors.dto.VisitorResponse;
import com.egaz.visitors.entity.Visitor;
import com.egaz.visitors.repository.ExpertRepository;
import com.egaz.visitors.repository.VisitorRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class VisitorServiceTest {

    @Mock
    private VisitorRepository visitorRepository;

    @Mock
    private ExpertRepository expertRepository;

    private VisitorService visitorService;

    @BeforeEach
    void setUp() {
        visitorService = new VisitorService(visitorRepository, expertRepository);
    }

    @Test
    void create_reactivatesExistingCheckedOutVisitorInsteadOfCreatingDuplicate() {
        Visitor existing = new Visitor();
        existing.setId("existing-id");
        existing.setFullName("Jane Doe");
        existing.setPhone("+255700000000");
        existing.setIdNumber("123456");
        existing.setPurpose("Meeting");
        existing.setCheckInDate(LocalDateTime.now().minusDays(2));
        existing.setCheckOutDate(LocalDateTime.now().minusDays(1));

        when(visitorRepository.findFirstByIdNumberIgnoreCaseOrderByCheckInDateDesc("123456"))
            .thenReturn(Optional.of(existing));
        when(visitorRepository.save(any(Visitor.class))).thenAnswer(invocation -> invocation.getArgument(0));

        VisitorRequest request = new VisitorRequest(
            "Jane Doe",
            null,
            null,
            "jane@example.com",
            "+255700000000",
            "EGAZ",
            "NIDA",
            "123456",
            null,
            "N/A",
            "Meeting",
            "Reception",
            null
        );

        VisitorResponse response = visitorService.create(request);

        assertNotNull(response);
        assertEquals("existing-id", response.id());
        assertEquals("Jane Doe", response.fullName());
        assertEquals("E-Government of Zanzibar", response.company());
        assertEquals("Meeting", response.purpose());
        assertEquals(null, response.checkOutDate());
    }

    @Test
    void create_newVisitorUsesFixedCompanyInsteadOfSubmittedCompany() {
        when(visitorRepository.findFirstByIdNumberIgnoreCaseOrderByCheckInDateDesc("654321"))
            .thenReturn(Optional.empty());
        when(visitorRepository.save(any(Visitor.class))).thenAnswer(invocation -> invocation.getArgument(0));

        VisitorRequest request = new VisitorRequest(
            "Alex Visitor",
            null,
            null,
            null,
            "+255700000001",
            "Another Company",
            "NIDA",
            "654321",
            null,
            null,
            "Meeting",
            "Reception",
            null
        );

        VisitorResponse response = visitorService.create(request);

        assertEquals("E-Government of Zanzibar", response.company());
    }

    @Test
    void create_persistsFirstAndLastNamesAndReturnsCombinedFullName() {
        when(visitorRepository.findFirstByIdNumberIgnoreCaseOrderByCheckInDateDesc("654322"))
            .thenReturn(Optional.empty());
        when(visitorRepository.save(any(Visitor.class))).thenAnswer(invocation -> invocation.getArgument(0));

        VisitorRequest request = new VisitorRequest(
            null,
            "Asha",
            "Ali",
            null,
            "+255700000002",
            null,
            "NIDA",
            "654322",
            null,
            null,
            "Meeting",
            "Reception",
            null
        );

        VisitorResponse response = visitorService.create(request);

        assertEquals("Asha", response.firstName());
        assertEquals("Ali", response.lastName());
        assertEquals("Asha Ali", response.fullName());
    }

    @Test
    void checkoutWithoutReferenceDoesNotAssignSystemAttribution() {
        Visitor activeVisitor = new Visitor();
        activeVisitor.setId("v-1");
        activeVisitor.setFullName("John Smith");
        activeVisitor.setPhone("+255700111222");
        activeVisitor.setPurpose("Meeting");
        activeVisitor.setCheckInDate(LocalDateTime.of(2026, 9, 25, 8, 0));

        when(visitorRepository.findById("v-1")).thenReturn(Optional.of(activeVisitor));
        when(visitorRepository.save(any(Visitor.class))).thenAnswer(invocation -> invocation.getArgument(0));

        VisitorResponse response = visitorService.checkout("v-1", new CheckoutRequest(null, null));

        assertNotNull(response.checkOutDate());
        assertNull(response.checkoutReference());
    }

    @Test
    void autoCheckoutVisitorsAt430PmRegardlessOfCheckInTime() {
        LocalDateTime now = LocalDateTime.of(2026, 9, 25, 16, 30);
        Visitor morningVisitor = new Visitor();
        morningVisitor.setId("morning");
        morningVisitor.setCheckInDate(LocalDateTime.of(2026, 9, 25, 8, 0));
        Visitor afternoonVisitor = new Visitor();
        afternoonVisitor.setId("afternoon");
        afternoonVisitor.setCheckInDate(LocalDateTime.of(2026, 9, 25, 16, 20));

        when(visitorRepository.findByCheckOutDateIsNullOrderByCheckInDateDesc())
            .thenReturn(List.of(morningVisitor, afternoonVisitor));
        when(visitorRepository.save(any(Visitor.class))).thenAnswer(invocation -> invocation.getArgument(0));

        visitorService.autoCheckoutExpiredVisitors(now);

        LocalDateTime expectedCheckout = LocalDateTime.of(2026, 9, 25, 16, 30);
        assertEquals(expectedCheckout, morningVisitor.getCheckOutDate());
        assertEquals(expectedCheckout, afternoonVisitor.getCheckOutDate());
        assertEquals("System help you to checkout the visitor", morningVisitor.getCheckoutReference());
        assertEquals("System help you to checkout the visitor", afternoonVisitor.getCheckoutReference());
    }

    @Test
    void autoCheckoutDoesNotCloseVisitorsBefore430Pm() {
        LocalDateTime now = LocalDateTime.of(2026, 9, 25, 16, 29);
        Visitor activeVisitor = new Visitor();
        activeVisitor.setId("active");
        activeVisitor.setCheckInDate(LocalDateTime.of(2026, 9, 25, 8, 0));

        when(visitorRepository.findByCheckOutDateIsNullOrderByCheckInDateDesc())
            .thenReturn(List.of(activeVisitor));

        visitorService.autoCheckoutExpiredVisitors(now);

        assertNull(activeVisitor.getCheckOutDate());
    }
}
