# Temi Navigator - 핸드폰 앱

## 구조

```
lib/
├── main.dart                  # 앱 진입점 + 스플래시
├── models/
│   └── position.dart          # TemiPosition, StampSpot 모델
├── services/
│   ├── socket_service.dart    # 소켓 통신 (실시간 위치 수신)
│   └── api_service.dart       # REST API (스팟 목록, 스탬프)
├── screens/
│   └── map_screen.dart        # 메인 지도 화면
└── widgets/
    └── map_painter.dart       # 2D 맵 CustomPainter
```

---

## 설치 & 실행

```bash
flutter pub get
flutter run
```

---

## 서버 IP 설정 (중요!)

두 파일에서 `YOUR_SERVER_IP` 변경:

```
lib/services/socket_service.dart  → _serverUrl
lib/services/api_service.dart     → _baseUrl
```

예시:
```dart
static const String _serverUrl = 'http://192.168.0.100:3000';
```

---

## 나중에 맵 이미지 추가하는 법

1. `assets/classroom_map.png` 에 이미지 파일 추가

2. `map_screen.dart` 의 주석 해제:
```dart
image: DecorationImage(
  image: AssetImage('assets/classroom_map.png'),
  fit: BoxFit.contain,
),
```

3. `map_painter.dart` 의 mapRangeX/Y를 실제 교실 크기(미터)로 수정

---

## 좌표 캘리브레이션

Temi 좌표계와 맵 픽셀 좌표를 맞추려면:

1. Temi를 교실 모서리 2곳에 위치시키고 좌표 기록
2. `map_painter.dart` → `_toCanvas()` 함수에서 scale/offset 조정
3. 맵 이미지 상의 같은 위치 픽셀과 매핑

---

## 소켓 이벤트 (백엔드 팀 참고)

수신:
- `app:temi_position` → `{ x, y, yaw }`
- `app:stamp_updated` → `{ user_id, stamp_id, total_stamps, completed }`

---

## 남은 작업

- [ ] 맵 이미지 연결
- [ ] 좌표 캘리브레이션
- [ ] Temi goTo 버튼 (스팟 클릭 시 이동)
- [ ] 퀴즈/이벤트 화면 추가
