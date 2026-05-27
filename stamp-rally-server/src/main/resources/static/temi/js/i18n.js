/* Minimal kiosk i18n (Korean/English) for Temi pages */
(function () {
  var KEY = "temiLang";

  function getLang() {
    try {
      var q = new URLSearchParams(location.search).get("lang");
      if (q === "en" || q === "ko") return q;
    } catch (e) {}
    try {
      var v = localStorage.getItem(KEY);
      if (v === "en" || v === "ko") return v;
    } catch (e) {}
    return "ko";
  }

  function setLang(lang) {
    try {
      localStorage.setItem(KEY, lang);
    } catch (e) {}
    apply(lang);
  }

  var dict = {
    ko: {
      "photo.title": "인생네컷 포토부스",
      "photo.subtitle": "포켓몬 프레임과 함께 오늘의 추억을 남겨 보세요!",
      "photo.step1.title": "프레임 선택",
      "photo.step1.body": "이브이, 피카츄, 잠만보 테마 중 마음에 드는 프레임을 골라요.",
      "photo.step2.title": "촬영하기",
      "photo.step2.body": "화면을 보고 셔터 버튼을 눌러 한 장을 남겨요.",
      "photo.step3.title": "QR로 받기",
      "photo.step3.body": "촬영 후 QR을 스캔하면 휴대폰으로 사진을 받을 수 있어요.",
      "photo.go": "촬영할래요!",
      "photo.cancel": "괜찮아요",
      "help.text": "도움이 필요하신가요? 옆에 있는 스태프에게 문의해 주세요.",

      "capture.filters": "프레임 선택",
      "capture.hint.pick": "프레임을 선택한 뒤 버튼을 눌러 촬영하세요!",
      "capture.hint.press": "버튼을 눌러 촬영하세요!",
      "capture.result.title": "멋진 사진이네요!",
      "capture.result.qr": "아래 QR 코드를 스캔하여\n휴대폰으로 사진을 받아보세요.",
      "capture.result.retake": "다시 촬영하기",
      "capture.result.home": "처음으로 돌아가기",
      "capture.uploading": "업로드 중…",
      "capture.camera.unsupported": "이 환경에서는 카메라를 사용할 수 없습니다.",
      "capture.camera.permission": "카메라 권한이 필요합니다. 브라우저·WebView 설정에서 허용해 주세요.",
      "notify.none": "새 알림이 없습니다.",
    },
    en: {
      "photo.title": "4‑Cut Photo Booth",
      "photo.subtitle": "Capture today’s memories with Pokémon frames!",
      "photo.step1.title": "Choose a frame",
      "photo.step1.body": "Pick your favorite theme: Eevee, Pikachu, or Snorlax.",
      "photo.step2.title": "Take a photo",
      "photo.step2.body": "Look at the screen and press the shutter button.",
      "photo.step3.title": "Get it via QR",
      "photo.step3.body": "Scan the QR code to receive your photo on your phone.",
      "photo.go": "Start shooting!",
      "photo.cancel": "Not now",
      "help.text": "Need help? Please ask a nearby staff member.",

      "capture.filters": "Choose a frame",
      "capture.hint.pick": "Choose a frame, then press the button to take a photo!",
      "capture.hint.press": "Press the button to take a photo!",
      "capture.result.title": "Great shot!",
      "capture.result.qr": "Scan the QR code below\nto receive your photo on your phone.",
      "capture.result.retake": "Retake",
      "capture.result.home": "Back to home",
      "capture.uploading": "Uploading…",
      "capture.camera.unsupported": "Camera is not available in this environment.",
      "capture.camera.permission": "Camera permission is required. Please allow it in your settings.",
      "notify.none": "No new notifications.",
    },
  };

  function t(lang, key) {
    return (dict[lang] && dict[lang][key]) || (dict.ko && dict.ko[key]) || "";
  }

  function apply(lang) {
    document.documentElement.lang = lang === "en" ? "en" : "ko";
    var nodes = document.querySelectorAll("[data-i18n]");
    nodes.forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      var val = t(lang, key);
      if (!val) return;
      el.textContent = val;
    });
    var brNodes = document.querySelectorAll("[data-i18n-br]");
    brNodes.forEach(function (el) {
      var key = el.getAttribute("data-i18n-br");
      var val = t(lang, key);
      if (!val) return;
      el.innerHTML = String(val).replace(/\n/g, "<br />");
    });

    var koBtn = document.getElementById("btnLangKo");
    var enBtn = document.getElementById("btnLangEn");
    if (koBtn && enBtn) {
      if (lang === "en") {
        enBtn.classList.add("is-active");
        enBtn.classList.remove("is-muted");
        koBtn.classList.add("is-muted");
        koBtn.classList.remove("is-active");
      } else {
        koBtn.classList.add("is-active");
        koBtn.classList.remove("is-muted");
        enBtn.classList.add("is-muted");
        enBtn.classList.remove("is-active");
      }
    }
  }

  window.TemiI18n = { getLang: getLang, setLang: setLang, apply: apply };

  window.addEventListener("load", function () {
    apply(getLang());
  });
})();

