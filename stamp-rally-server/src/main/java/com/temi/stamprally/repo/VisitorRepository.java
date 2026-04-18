package com.temi.stamprally.repo;

import com.temi.stamprally.domain.Visitor;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VisitorRepository extends JpaRepository<Visitor, Long> {

  Optional<Visitor> findByToken(String token);
}
