package com.temi.stamprally.config;

import com.temi.stamprally.domain.Exhibition;
import com.temi.stamprally.domain.StampSpot;
import com.temi.stamprally.repo.ExhibitionRepository;
import com.temi.stamprally.repo.StampSpotRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class SeedDataRunner implements ApplicationRunner {

  private final StampSpotRepository stampSpotRepository;
  private final ExhibitionRepository exhibitionRepository;

  public SeedDataRunner(
      StampSpotRepository stampSpotRepository, ExhibitionRepository exhibitionRepository) {
    this.stampSpotRepository = stampSpotRepository;
    this.exhibitionRepository = exhibitionRepository;
  }

  @Override
  public void run(ApplicationArguments args) {
    double baseLat = 37.5665;
    double baseLon = 126.9780;

    if (exhibitionRepository.count() == 0) {
      exhibitionRepository.save(
          new Exhibition(
              "도시의 빛 — 야경 사진전",
              "한강과 도심 야경을 주제로 한 사진 전시입니다. 감상 후 체험 코너에서 짧은 영상도 볼 수 있습니다.",
              "A존",
              "1층 중앙 홀",
              "",
              baseLat + 0.00012,
              baseLon + 0.00006,
              12,
              "중앙 로비에서 오른쪽 복도로 20m",
              "주말 야간 투어"));
      exhibitionRepository.save(
          new Exhibition(
              "미래 모빌리티 체험관",
              "자율주행·로봇 배송 등 미래 이동 수단을 축소 모형과 패널로 소개합니다.",
              "B존",
              "2층 동편",
              "",
              baseLat - 0.00008,
              baseLon + 0.00011,
              20,
              "에스컬레이터로 2층 이동 후 동편 안내판 따라 이동",
              "체험 이벤트 — 줄서기"));
      exhibitionRepository.save(
          new Exhibition(
              "어린이 과학 놀이터",
              "가족 관람객을 위한 과학 원리 체험형 전시입니다.",
              "C존",
              "2층 서편",
              "",
              baseLat + 0.00004,
              baseLon - 0.0001,
              25,
              "2층 서편 파란 벽면 쪽",
              "가족 스탬프 이벤트"));
      exhibitionRepository.save(
          new Exhibition(
              "특별 기획 — 디지털 아카이브",
              "지역사 자료를 디지털로 복원·전시한 특별관입니다.",
              "D존",
              "3층 특별관",
              "",
              baseLat + 0.00002,
              baseLon - 0.00015,
              18,
              "3층 특별관 입구 매표소 옆",
              "기념품 할인 쿠폰"));
    }

    if (stampSpotRepository.count() == 0) {
      stampSpotRepository.save(
          new StampSpot("RALLY-1", "1구역 안내 데스크", baseLat + 0.00015, baseLon + 0.0001, 35));
      stampSpotRepository.save(
          new StampSpot("RALLY-2", "2구역 체험존", baseLat - 0.00012, baseLon + 0.00008, 40));
      stampSpotRepository.save(
          new StampSpot("RALLY-3", "이벤트 홀", baseLat + 0.00005, baseLon - 0.00014, 45));
      stampSpotRepository.save(
          new StampSpot("RALLY-4", "기념품 코너", baseLat - 0.00005, baseLon - 0.00009, 40));
    }
  }
}
