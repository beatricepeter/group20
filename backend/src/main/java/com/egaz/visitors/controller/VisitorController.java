package com.egaz.visitors.controller;

import com.egaz.visitors.dto.CheckoutRequest;
import com.egaz.visitors.dto.VisitorRequest;
import com.egaz.visitors.dto.VisitorResponse;
import com.egaz.visitors.service.VisitorService;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/visitors")
@CrossOrigin(origins = "*")
public class VisitorController {
    private final VisitorService service;
    public VisitorController(VisitorService service) { this.service = service; }

    @GetMapping
    public List<VisitorResponse> all(
        @RequestParam(required = false) String expertId,
        @RequestParam(required = false) Boolean active,
        @RequestParam(required = false) LocalDate from,
        @RequestParam(required = false) LocalDate to) {
        return service.findAll(expertId, active, from, to);
    }

    @GetMapping("/{id}")
    public VisitorResponse one(@PathVariable String id) { return service.findById(id); }

    @GetMapping("/lookup")
    public ResponseEntity<VisitorResponse> lookup(
        @RequestParam String idNumber) {
        VisitorResponse visitor = service.findByIdentity(idNumber);
        return visitor != null ? ResponseEntity.ok(visitor) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<VisitorResponse> create(@RequestBody VisitorRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    public VisitorResponse update(@PathVariable String id, @RequestBody VisitorRequest request) {
        return service.update(id, request);
    }

    @PatchMapping("/{id}/checkout")
    public VisitorResponse checkout(@PathVariable String id, @RequestBody(required = false) CheckoutRequest request) {
        return service.checkout(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) { service.delete(id); }
}
