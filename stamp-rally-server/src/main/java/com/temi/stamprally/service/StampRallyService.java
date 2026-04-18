package com.temi.stamprally.service;

import com.temi.stamprally.domain.CollectedStamp;
import com.temi.stamprally.domain.StampSpot;
import com.temi.stamprally.domain.Visitor;
import com.temi.stamprally.geo.GeoUtils;
import com.temi.stamprally.repo.CollectedStampRepository;
import com.temi.stamprally.repo.StampSpotRepository;
import com.temi.stamprally.repo.VisitorRepository;
import com.temi.stamprally.web.dto.CollectedStampResponse;
import com.temi.stamprally.web.dto.LocationResultResponse;
import com.temi.stamprally.web.dto.RallyMetaResponse;
import com.temi.stamprally.web.dto.RallyStatusResponse;
import com.temi.stamprally.web.dto.StampClaimResponse;
import com.temi.stamprally.web.dto.StampSpotResponse;
import com.temi.stamprally.web.dto.VisitorSessionResponse;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class StampRallyService {

  private final VisitorRepository visitorRepository;
  private final StampSpotRepository stampSpotRepository;
  private final CollectedStampRepository collectedStampRepository;

  public StampRallyService(
      VisitorRepository visitorRepository,
      StampSpotRepository stampSpotRepository,
      CollectedStampRepository collectedStampRepository) {
    this.visitorRepository = visitorRepository;
    this.stampSpotRepository = stampSpotRepository;
    this.collectedStampRepository = collectedStampRepository;
  }

  @Transactional
  public VisitorSessionResponse createVisitor(String nickname) {
    Visitor v = Visitor.create(nickname);
    visitorRepository.save(v);
    return new VisitorSessionResponse(v.getToken(), v.getNickname());
  }

  @Transactional
  public LocationResultResponse processLocation(String token, double latitude, double longitude) {
    Visitor visitor = findVisitor(token);
    List<StampSpot> spots = stampSpotRepository.findAll();
    List<StampSpotResponse> newlyCollected = new ArrayList<>();

    for (StampSpot spot : spots) {
      double m =
          GeoUtils.distanceMeters(
              latitude, longitude, spot.getLatitude(), spot.getLongitude());
      if (m > spot.getRadiusMeters()) {
        continue;
      }
      if (collectedStampRepository.existsByVisitorAndStampSpot(visitor, spot)) {
        continue;
      }
      collectedStampRepository.save(new CollectedStamp(visitor, spot));
      newlyCollected.add(toSpotResponse(spot, m));
    }

    int total = collectedStampRepository.findByVisitorOrderByCollectedAtAsc(visitor).size();
    return new LocationResultResponse(newlyCollected, total);
  }

  @Transactional
  public StampClaimResponse claimByQr(String token, String rawQr) {
    Visitor visitor = findVisitor(token);
    String qr = rawQr == null ? "" : rawQr.trim();
    if (qr.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "empty qr");
    }
    StampSpot spot =
        stampSpotRepository
            .findByCodeIgnoreCase(qr)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "unknown spot code"));
    int totalSpots = (int) stampSpotRepository.count();
    if (collectedStampRepository.existsByVisitorAndStampSpot(visitor, spot)) {
      int total = collectedStampRepository.findByVisitorOrderByCollectedAtAsc(visitor).size();
      return new StampClaimResponse(
          false,
          true,
          spot.getCode(),
          spot.getName(),
          total,
          totalSpots,
          totalSpots > 0 && total >= totalSpots);
    }
    collectedStampRepository.save(new CollectedStamp(visitor, spot));
    int total = collectedStampRepository.findByVisitorOrderByCollectedAtAsc(visitor).size();
    return new StampClaimResponse(
        true,
        false,
        spot.getCode(),
        spot.getName(),
        total,
        totalSpots,
        totalSpots > 0 && total >= totalSpots);
  }

  @Transactional(readOnly = true)
  public RallyStatusResponse rallyStatus(String token) {
    Visitor visitor = findVisitor(token);
    int totalSpots = (int) stampSpotRepository.count();
    int collected = collectedStampRepository.findByVisitorOrderByCollectedAtAsc(visitor).size();
    return new RallyStatusResponse(
        totalSpots, collected, totalSpots > 0 && collected >= totalSpots);
  }

  @Transactional(readOnly = true)
  public RallyMetaResponse rallyMeta() {
    return new RallyMetaResponse((int) stampSpotRepository.count(), "테미 스탬프 랠리");
  }

  @Transactional(readOnly = true)
  public List<CollectedStampResponse> listCollected(String token) {
    Visitor visitor = findVisitor(token);
    return collectedStampRepository.findByVisitorOrderByCollectedAtAsc(visitor).stream()
        .map(
            c ->
                new CollectedStampResponse(
                    c.getStampSpot().getCode(),
                    c.getStampSpot().getName(),
                    c.getCollectedAt().toString()))
        .toList();
  }

  @Transactional(readOnly = true)
  public List<StampSpotResponse> listAllSpots() {
    return stampSpotRepository.findAll().stream()
        .map(s -> toSpotResponse(s, null))
        .toList();
  }

  private Visitor findVisitor(String token) {
    return visitorRepository
        .findByToken(token)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "unknown visitor"));
  }

  private static StampSpotResponse toSpotResponse(StampSpot spot, Double distanceMeters) {
    return new StampSpotResponse(
        spot.getCode(), spot.getName(), spot.getLatitude(), spot.getLongitude(), distanceMeters);
  }
}
