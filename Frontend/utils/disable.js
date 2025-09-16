// entry.js (bundle this into production only)
import disableDevtool from "disable-devtool";

// initialize the package (basic)
try {
  disableDevtool({
    disableMenu: true,
    disableCopy: true,
  });
} catch (e) {
  /* fail silently in dev */
}

// 1) Block common keyboard shortcuts that open DevTools or view-source
function blockDevShortcuts(e) {
  // Common keys: F12, Ctrl+Shift+I/J/C, Ctrl+U, Ctrl+Shift+C, Ctrl+Shift+K (some browsers)
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const meta = isMac ? e.metaKey : e.ctrlKey;

  if (
    e.key === "F12" ||
    (meta &&
      e.shiftKey &&
      ["I", "J", "C", "K"].includes(e.key.toUpperCase())) ||
    (meta && e.key.toUpperCase() === "U") ||
    (meta && e.key.toUpperCase() === "S" && e.shiftKey) // sometimes used
  ) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
}
window.addEventListener("keydown", blockDevShortcuts, { capture: true });

// 2) Disable right-click / context menu
window.addEventListener(
  "contextmenu",
  function (e) {
    e.preventDefault();
  },
  { capture: true }
);

// 3) Block selecting and copying (optional, because annoying to users)
window.addEventListener(
  "copy",
  function (e) {
    e.preventDefault();
  },
  { capture: true }
);
window.addEventListener(
  "selectstart",
  function (e) {
    e.preventDefault();
  },
  { capture: true }
);

// 4) Detect DevTools open by measuring available viewport or using debugger trick.
//    If detected, take an action (reload, redirect, show overlay).
let devtoolsOpen = false;
const threshold = 160; // px difference threshold

function detectByResize() {
  const widthDiff = window.outerWidth - window.innerWidth;
  const heightDiff = window.outerHeight - window.innerHeight;
  const open = widthDiff > threshold || heightDiff > threshold;
  if (open && !devtoolsOpen) {
    devtoolsOpen = true;
    onDevtoolsOpen();
  } else if (!open && devtoolsOpen) {
    devtoolsOpen = false;
    onDevtoolsClose();
  }
}

// additional detection: `debugger` timing trick
function detectByDebugger() {
  const start = Date.now();
  // eslint-disable-next-line no-unused-vars
  for (let i = 0; i < 100000; i++) {
    // burn cycles
  }
  const delta = Date.now() - start;
  // If paused by devtools we may get an unexpectedly large delta (heuristic)
  if (delta > 200 && !devtoolsOpen) {
    devtoolsOpen = true;
    onDevtoolsOpen();
  }
}

function onDevtoolsOpen() {
  // Reaction: blank the page, redirect, or logout user
  try {
    // example: destroy DOM and redirect
    document.documentElement.innerHTML = "";
    // optionally: send a beacon to server
    navigator.sendBeacon && navigator.sendBeacon("/api/devtools-detected");
    // hard redirect
    window.location.replace("about:blank");
  } catch (e) {
    // fallback
    window.location.reload();
  }
}

function onDevtoolsClose() {
  // no-op or you can force logout/refetch token
}

// poll & listen for resize
window.addEventListener("resize", detectByResize);
setInterval(() => {
  detectByResize();
  detectByDebugger();
}, 1000);
