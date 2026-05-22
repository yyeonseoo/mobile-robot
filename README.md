# mobile-robot

테미 키오스크·모바일 스탬프 랠리 MVP. 백엔드는 **Spring Boot(Maven)** 프로젝트 `stamp-rally-server`에 있습니다.

## Android Studio에서 서버 실행

1. **Android Studio**를 실행합니다.
2. **File → Open**에서 이 저장소 안의 **`stamp-rally-server`** 폴더만 선택합니다. (`pom.xml`이 보이는 폴더)
3. **Trust Project** 후, 우측 또는 하단의 **Maven** 가져오기(동기화)가 끝날 때까지 기다립니다.
4. `src/main/java/com/temi/stamprally/StampRallyApplication.java`를 연 다음, 클래스 옆 **초록 실행 버튼** 또는 에디터에서 **우클릭 → Run 'StampRallyApplication'**으로 실행합니다.
5. 실행이 되면 브라우저에서 아래 주소로 확인합니다.
   - 테미 홈: [http://localhost:8080/temi/index.html](http://localhost:8080/temi/index.html) (1920×1200, 랜딩 UI + `js/temi-bridge.js` — Android 연동은 `temi/BRIDGE.md`)
   - 모바일: [http://localhost:8080/mobile/index.html](http://localhost:8080/mobile/index.html)

### Maven으로 실행하고 싶을 때

**View → Tool Windows → Maven**에서 `stamp-rally-server` → **Plugins** → **spring-boot** → **`spring-boot:run`**을 더블클릭해도 됩니다.

### Claude API (도감·이벤트 추천)

이벤트 화면(`/temi/events.html`, 모바일 `/mobile/app/events`)은 **서버** `POST /api/ai/*` 를 호출합니다. 키는 **`.env` 또는 환경변수**로만 넣고, Git·브라우저에는 넣지 마세요.

**1) `.env` 파일 만들기 (권장)**

```bash
cd stamp-rally-server
cp .env.example .env
# .env 를 열어 ANTHROPIC_API_KEY=sk-ant-api03-... 를 본인 키로 수정
mvn spring-boot:run
```

**2) 환경변수로 넣기 (대안)**

```bash
export ANTHROPIC_API_KEY=sk-ant-api03-...
cd stamp-rally-server && mvn spring-boot:run
```

**3) 화면에서 확인**

| 화면 | URL |
|------|-----|
| 테미 키오스크 | http://localhost:8080/temi/events.html — 검색 / 「Claude 맞춤 추천」 |
| 모바일 (빌드) | http://localhost:8080/mobile/app/events |
| 모바일 (개발) | `cd mobile-web && npm run dev` → `/mobile/app/events` (8080 서버 + Vite `/api` 프록시 필요) |

- `POST /api/ai/pokedex` — `{ "query": "피카츄" }`
- `POST /api/ai/events/recommend` — `{ "interests": "...", "companion": "..." }`
- `POST /api/ai/challenges/daily` — `{ "type": "puzzle|race|quiz|memory", "topic": "선택" }`

키가 없으면 **503**과 안내 메시지가 반환됩니다. `.env` 는 `.gitignore`에 포함되어 있습니다.

### 참고

- 기본 프로필은 **dev**입니다. `home.css` 등은 저장 후 **브라우저 새로고침만** 해도 반영되도록, 정적 파일을 `src/main/resources/static/`에서 직접 읽습니다. (Run 작업 디렉터리가 `stamp-rally-server` 모듈 루트여야 합니다.)
- 배포용으로는 `-Dspring.profiles.active=prod` 로 **prod** 프로필을 켜면 JAR 안의 `classpath:/static/`만 사용합니다.
- 저장소 루트의 `index.html`은 로컬에서 링크 모아 보기용입니다. API·화면 연동은 **반드시 위 localhost 주소**로 봅니다.
