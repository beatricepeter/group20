package com.egaz.visitors.repository;

import com.egaz.visitors.entity.Expert;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExpertRepository extends JpaRepository<Expert, String> {
	Optional<Expert> findByUsername(String username);
	boolean existsByUsername(String username);
}
