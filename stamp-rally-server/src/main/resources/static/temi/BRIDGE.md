# Temi WebView JS Bridge

React/정적 HTML은 **Temi SDK를 직접 호출할 수 없습니다.** Android 앱이 SDK를 실행하고, WebView에서 `TemiBridge`를 노출합니다.

## Web API (`js/temi-bridge.js`)

| 메서드 | 설명 |
|--------|------|
| `TemiBridge.goto(locationId)` | 로봇 이동 요청. 성공 시 `temi:nav` `{ state: 'moving' }` |
| `TemiBridge.getNavState()` | `idle` \| `moving` \| `arrived` \| `error` |
| `TemiBridge.speak(text)` | TTS (네이티브 없으면 `speechSynthesis`) |
| `TemiBridge.isAvailable()` | 네이티브 Bridge 연결 여부 |
| `TemiBridge._emitNav(detail)` | **Android → Web** 상태 전달용 |

이벤트: `window.addEventListener('temi:nav', (e) => e.detail)`

## Android (Kotlin 예시)

```kotlin
class TemiBridgeNative(private val robot: Robot) {
    @JavascriptInterface
    fun goto(locationId: String) {
        robot.goTo(locationId) // SDK
    }

    @JavascriptInterface
    fun getNavState(): String = navState

    @JavascriptInterface
    fun speak(text: String) { /* TTS */ }

    fun notifyWeb(webView: WebView, state: String, locationId: String?) {
        val json = """{"state":"$state","locationId":"${locationId ?: ""}"}"""
        webView.post {
            webView.evaluateJavascript(
                "window.TemiBridge&&window.TemiBridge._emitNav($json);", null)
        }
    }
}

// webView.settings.javaScriptEnabled = true
// webView.addJavascriptInterface(TemiBridgeNative(...), "TemiBridgeNative")
// loadUrl("http://<server>:8080/temi/index.html")
```

`locationId`는 Temi 맵에 등록한 **Location 이름**과 동일해야 합니다 (`guide.html` 구역 id와 맞추기).

## 로컬 URL

- 키오스크 홈: `http://<host>:8080/temi/index.html` (캐시 버스트는 `TemiIndexHtmlController`)
