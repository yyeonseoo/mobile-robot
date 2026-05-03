package com.temi.stamprally.repo;

import com.temi.stamprally.domain.CollectedStamp;
import com.temi.stamprally.domain.StampSpot;
import com.temi.stamprally.domain.Visitor;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CollectedStampRepository extends JpaRepository<CollectedStamp, Long> {

  boolean existsByVisitorAndStampSpot(Visitor visitor, StampSpot spot);

  List<CollectedStamp> findByVisitorOrderByCollectedAtAsc(Visitor visitor);
}
