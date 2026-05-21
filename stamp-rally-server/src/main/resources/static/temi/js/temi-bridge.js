/**
 * Temi WebView ↔ Android JS Bridge (stub + browser fallback).
 *
 * Android: @JavascriptInterface on object named "TemiBridgeNative"
 *   - goto(locationId: string)
 *   - getNavState() -> "idle"|"moving"|"arrived"|"error"
 *
 * Web → Android: TemiBridge.goto("ZONE_A")
 * Android → Web: TemiBridge._emitNav({ state, locationId?, message? })
 */
(function (global) {
  "use strict";

  var NAV_EVENT = "temi:nav";

  function parseNavPayload(detail) {
    if (!detail || typeof detail !== "object") return { state: "idle" };
    return {
      state: detail.state || "idle",
      locationId: detail.locationId || detail.location_id || null,
      message: detail.message || null,
    };
  }

  function emitNav(detail) {
    try {
      global.dispatchEvent(new CustomEvent(NAV_EVENT, { detail: parseNavPayload(detail) }));
    } catch (e) {
      /* IE/WebView old */
    }
  }

  var native =
    (global.TemiBridgeNative && typeof global.TemiBridgeNative.goto === "function" && global.TemiBridgeNative) ||
    null;

  var TemiBridge = {
    isAvailable: function () {
      return !!native;
    },

    goto: function (locationId) {
      var id = String(locationId || "").trim();
      if (!id) return false;
      if (native) {
        try {
          native.goto(id);
          emitNav({ state: "moving", locationId: id });
          return true;
        } catch (err) {
          emitNav({ state: "error", locationId: id, message: String(err) });
          return false;
        }
      }
      console.info("[TemiBridge] goto (demo)", id);
      emitNav({ state: "moving", locationId: id, message: "demo" });
      return false;
    },

    getNavState: function () {
      if (native && typeof native.getNavState === "function") {
        try {
          return String(native.getNavState());
        } catch (e) {
          return "error";
        }
      }
      return "idle";
    },

    speak: function (text) {
      var t = String(text || "").trim();
      if (!t) return;
      if (native && typeof native.speak === "function") {
        try {
          native.speak(t);
          return;
        } catch (e) {
          /* fall through */
        }
      }
      if (global.speechSynthesis) {
        var u = new SpeechSynthesisUtterance(t);
        u.lang = "ko-KR";
        u.rate = 0.95;
        global.speechSynthesis.cancel();
        global.speechSynthesis.speak(u);
      }
    },

    /** Called from Android: TemiBridge._emitNav({ state: 'arrived', locationId: '...' }) */
    _emitNav: function (detail) {
      emitNav(detail);
    },
  };

  global.TemiBridge = TemiBridge;
  global.addEventListener(NAV_EVENT, function (ev) {
    var d = ev && ev.detail;
    if (d && d.state === "error" && d.message) {
      console.warn("[TemiBridge] nav error", d.message);
    }
  });
})(typeof window !== "undefined" ? window : this);
