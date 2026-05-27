package com.temi.stamprally.repo;

import com.temi.stamprally.domain.Visitor;
import com.temi.stamprally.domain.VisitorEventAction;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VisitorEventActionRepository extends JpaRepository<VisitorEventAction, Long> {

  List<VisitorEventAction> findByVisitorOrderByCreatedAtDesc(Visitor visitor);

  Optional<VisitorEventAction> findByVisitorAndEventIdAndActionType(
      Visitor visitor, String eventId, String actionType);

  long countByVisitor(Visitor visitor);
}

