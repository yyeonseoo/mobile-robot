package com.temi.stamprally.repo;

import com.temi.stamprally.domain.QuizChallengeRecord;
import com.temi.stamprally.domain.Visitor;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuizChallengeRecordRepository extends JpaRepository<QuizChallengeRecord, Long> {

  List<QuizChallengeRecord> findTop20ByVisitorOrderByAnsweredAtDesc(Visitor visitor);
}
