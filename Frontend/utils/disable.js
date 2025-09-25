// entry.js (bundle this into production only)
import disableDevtool from "./disable-devtool";

// initialize the package (basic)
try {
  disableDevtool({
    disableMenu: true,
    disableCopy: true,
  });
} catch (e) {
  /* fail silently in dev */
}

/* =========================
   Shortcuts / context / copy
   ========================= */

// // Block common DevTools shortcuts but allow zoom combos robustly
// function blockDevShortcuts(e) {
//   const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
//   const meta = isMac ? e.metaKey : e.ctrlKey;

//   // Let browser handle zoom combos (Ctrl/Cmd + + - 0, including numpad)
//   if (meta) {
//     const allowedZoomKeys = new Set(["+", "-", "=", "0", "Equal", "Minus"]);
//     if (
//       allowedZoomKeys.has(e.key) ||
//       e.code === "NumpadAdd" ||
//       e.code === "NumpadSubtract"
//     ) {
//       return; // allow zoom
//     }
//   }

//   // Block DevTools and view-source combos
//   if (
//     e.key === "F12" ||
//     (meta &&
//       e.shiftKey &&
//       ["I", "J", "C", "K"].includes(e.key.toUpperCase())) ||
//     (meta && e.key.toUpperCase() === "U") ||
//     (meta && e.shiftKey && e.key.toUpperCase() === "S")
//   ) {
//     e.preventDefault();
//     e.stopPropagation();
//     return false;
//   }
// }
// window.addEventListener("keydown", blockDevShortcuts, { capture: true });

// // Disable right-click / context menu
// window.addEventListener(
//   "contextmenu",
//   function (e) {
//     e.preventDefault();
//   },
//   { capture: true }
// );

// // Block selecting and copying (optional — keep if you want it)
// window.addEventListener(
//   "copy",
//   function (e) {
//     e.preventDefault();
//   },
//   { capture: true }
// );
// window.addEventListener(
//   "selectstart",
//   function (e) {
//     e.preventDefault();
//   },
//   { capture: true }
// );

// /* ===========================================
//    DevTools detection with zoom-awareness + ignore
//    =========================================== */

// let devtoolsOpen = false;
// const threshold = 160; // px difference threshold for outer - inner dims

// // Track initial devicePixelRatio so DPR changes (zoom) can be detected
// const initialDevicePixelRatio = window.devicePixelRatio || 1;

// // A short ignore window used while user is actively zooming so detection won't fire
// let ignoreUntil = 0;
// function setIgnore(ms = 800) {
//   ignoreUntil = Date.now() + ms;
// }

// // Detect whether user has zoomed (pinch/visualViewport scale or DPR change)
// function isUserZoomed() {
//   const vv = window.visualViewport;
//   const scale = vv && typeof vv.scale === "number" ? vv.scale : 1;
//   const dpr = window.devicePixelRatio || 1;

//   const scaleZoom = typeof scale === "number" && Math.abs(scale - 1) > 0.02;
//   const dprZoom = Math.abs(dpr - initialDevicePixelRatio) > 0.02;

//   return scaleZoom || dprZoom;
// }

// /* --- Mark ignore when user performs zoom actions --- */

// // Ctrl/Cmd + wheel (desktop zoom) -> set ignore
// window.addEventListener(
//   "wheel",
//   (e) => {
//     const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
//     const meta = isMac ? e.metaKey : e.ctrlKey;
//     if (meta) {
//       setIgnore(900); // ignore devtools heuristics briefly while zooming
//       return;
//     }
//   },
//   { passive: true, capture: true }
// );

// // visualViewport pinch/resize (mobile pinch or zoom UI) -> set ignore
// if (window.visualViewport) {
//   window.visualViewport.addEventListener(
//     "resize",
//     () => {
//       setIgnore(900);
//     },
//     { passive: true }
//   );
// } else {
//   // fallback for browsers without visualViewport
//   window.addEventListener(
//     "resize",
//     () => {
//       setIgnore(900);
//     },
//     { passive: true }
//   );
//   window.addEventListener(
//     "orientationchange",
//     () => {
//       setIgnore(900);
//     },
//     { passive: true }
//   );
// }

// // key-based zoom attempts (Ctrl/Cmd + + - 0) -> set ignore
// window.addEventListener(
//   "keydown",
//   (e) => {
//     const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
//     const meta = isMac ? e.metaKey : e.ctrlKey;
//     if (!meta) return;
//     const zoomKeyCandidates = new Set(["+", "=", "-", "0", "Equal", "Minus"]);
//     if (
//       zoomKeyCandidates.has(e.key) ||
//       e.code === "NumpadAdd" ||
//       e.code === "NumpadSubtract"
//     ) {
//       setIgnore(900);
//       return;
//     }
//   },
//   { capture: true }
// );

// /* --- Core detection (resize + debugger) --- */

// function detectByResize() {
//   // skip detection during recent zoom activity
//   if (Date.now() < ignoreUntil) {
//     if (devtoolsOpen) {
//       devtoolsOpen = false;
//       onDevtoolsClose();
//     }
//     return;
//   }

//   // skip detection if the user is zoomed (pinch or DPR change)
//   if (isUserZoomed()) {
//     if (devtoolsOpen) {
//       devtoolsOpen = false;
//       onDevtoolsClose();
//     }
//     return;
//   }

//   // measure differences
//   const widthDiff = Math.abs(window.outerWidth - window.innerWidth);
//   const heightDiff = Math.abs(window.outerHeight - window.innerHeight);
//   const open = widthDiff > threshold || heightDiff > threshold;

//   if (open && !devtoolsOpen) {
//     devtoolsOpen = true;
//     onDevtoolsOpen();
//   } else if (!open && devtoolsOpen) {
//     devtoolsOpen = false;
//     onDevtoolsClose();
//   }
// }

// function detectByDebugger() {
//   // skip if within ignore period or if user is zoomed
//   if (Date.now() < ignoreUntil) return;
//   if (isUserZoomed()) return;

//   const start = Date.now();
//   // burn cycles
//   for (let i = 0; i < 100000; i++) {}
//   const delta = Date.now() - start;

//   // heuristic: paused or slowed by devtools -> large delta
//   if (delta > 200 && !devtoolsOpen) {
//     devtoolsOpen = true;
//     onDevtoolsOpen();
//   }
// }

// function onDevtoolsOpen() {
//   // Reaction: blank the page, optionally report, then redirect
//   try {
//     document.documentElement.innerHTML = "";
//     if (navigator.sendBeacon) {
//       // best-effort reporting
//       try {
//         navigator.sendBeacon("/api/devtools-detected");
//       } catch (err) {
//         // ignore
//       }
//     }
//     // final action
//     window.location.replace("about:blank");
//   } catch (e) {
//     // fallback
//     window.location.reload();
//   }
// }

// function onDevtoolsClose() {
//   // no-op for now (could re-auth or reload resources)
// }

// /* --- Start polling/listeners --- */
// window.addEventListener("resize", detectByResize);
// setInterval(() => {
//   detectByResize();
//   detectByDebugger();
// }, 800);
