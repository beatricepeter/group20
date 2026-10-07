package com.egaz.visitors.controller;

import com.egaz.visitors.dto.UserRequest;
import com.egaz.visitors.dto.UserResponse;
import com.egaz.visitors.service.UserService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {
    private final UserService service;
    public UserController(UserService service) { this.service = service; }

    @GetMapping
    public List<UserResponse> all() { return service.findAll(); }

    @GetMapping("/{id}")
    public UserResponse one(@PathVariable String id) { return service.findById(id); }

    @GetMapping("/by-username/{username}")
    public UserResponse byUsername(@PathVariable String username) { return service.findByUsername(username); }

    @PostMapping
    public ResponseEntity<UserResponse> create(@RequestBody UserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    public UserResponse update(@PathVariable String id, @RequestBody UserRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) { service.delete(id); }
}
