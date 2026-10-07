package com.egaz.visitors.controller;

import com.egaz.visitors.dto.ExpertRequest;
import com.egaz.visitors.dto.ExpertResponse;
import com.egaz.visitors.service.ExpertService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/experts")
@CrossOrigin(origins = "*")
public class ExpertController {
    private final ExpertService service;
    public ExpertController(ExpertService service) { this.service = service; }

    @GetMapping
    public List<ExpertResponse> all() { return service.findAll(); }

    @GetMapping("/{id}")
    public ExpertResponse one(@PathVariable String id) { return service.findById(id); }

    @PostMapping
    public ResponseEntity<ExpertResponse> create(@RequestBody ExpertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    public ExpertResponse update(@PathVariable String id, @RequestBody ExpertRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) { service.delete(id); }
}
