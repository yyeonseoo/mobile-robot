package com.temi.stamprally.web;

import com.temi.stamprally.domain.Exhibition;
import com.temi.stamprally.repo.ExhibitionRepository;
import com.temi.stamprally.web.dto.ExhibitionResponse;
import java.util.Comparator;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/exhibitions")
public class ExhibitionsController {

  private final ExhibitionRepository exhibitionRepository;

  public ExhibitionsController(ExhibitionRepository exhibitionRepository) {
    this.exhibitionRepository = exhibitionRepository;
  }

  @GetMapping
  public List<ExhibitionResponse> list() {
    return exhibitionRepository.findAll().stream()
        .sorted(Comparator.comparing(Exhibition::getId))
        .map(ExhibitionResponse::from)
        .toList();
  }

  @GetMapping("/{id}")
  public ExhibitionResponse get(@PathVariable long id) {
    return exhibitionRepository
        .findById(id)
        .map(ExhibitionResponse::from)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "exhibition"));
  }
}
