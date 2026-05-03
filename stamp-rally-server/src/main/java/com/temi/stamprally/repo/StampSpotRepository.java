package com.temi.stamprally.repo;

import com.temi.stamprally.domain.StampSpot;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StampSpotRepository extends JpaRepository<StampSpot, Long> {

  Optional<StampSpot> findByCodeIgnoreCase(String code);
}
