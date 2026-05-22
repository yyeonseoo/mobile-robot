package com.temi.stamprally.repo;

import com.temi.stamprally.domain.Visitor;
import com.temi.stamprally.domain.VisitorPhoto;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VisitorPhotoRepository extends JpaRepository<VisitorPhoto, Long> {

  List<VisitorPhoto> findByVisitorOrderByCreatedAtDesc(Visitor visitor);

  long countByVisitor(Visitor visitor);
}
