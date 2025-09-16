// utils/devToolsBlocker.js
import { useEffect } from "react";

export const useDevToolsBlocker = (options = {}) => {
  useEffect(() => {
    // Track current zoom level (used if you want to scale thresholds)
    let currentZoom = window.devicePixelRatio || 1;

    const {
      disableMenu = true,
      disableCopy = true,
      onDevToolsOpen = defaultOnDevToolsOpen,
      onDevToolsClose = () => {},
      pollInterval = 500, // ms between checks (lower = more aggressive)
      enforceInterval = 200, // ms enforcement loop while devtools is open
      sendBeaconOnDetect = false, // optionally send repeated beacons
      beaconUrl = "/api/devtools-detected",
      redirectUrl = "https://www.youtube-nocookie.com/embed/IxX_QHay02M?autoplay=1&rel=0&modestbranding=1&start=5&loop=1&playlist=IxX_QHay02M",
      immediateRedirect = true, // redirect immediately when detected
    } = options;

    // Default action when DevTools is detected: immediate redirect (no countdown)
    function defaultOnDevToolsOpen() {
      try {
        // optional: create a tiny overlay to avoid a flash of original content,
        // but we'll redirect immediately.
        if (!document.getElementById("__devtools_overlay_manual")) {
          const overlay = document.createElement("div");
          overlay.id = "__devtools_overlay_manual";
          overlay.style.position = "fixed";
          overlay.style.inset = "0";
          overlay.style.background = "rgba(0,0,0,0.98)";
          overlay.style.color = "white";
          overlay.style.zIndex = "2147483647";
          overlay.style.display = "flex";
          overlay.style.alignItems = "center";
          overlay.style.justifyContent = "center";
          overlay.style.textAlign = "center";
          overlay.style.pointerEvents = "auto";
          overlay.innerHTML = `<div style="padding:20px;font-family:sans-serif;">
            <h1 style="color:#ff3333;margin:0 0 8px 0;font-size:20px">⚠️ Security Violation Detected</h1>
            <p style="margin:0;font-size:14px;opacity:0.9">DevTools are open. Redirecting now...</p>
          </div>`;
          try {
            document.documentElement.appendChild(overlay);
            document.documentElement.style.overflow = "hidden";
            document.body && (document.body.style.pointerEvents = "none");
          } catch (e) {
            // ignore DOM append errors (e.g., during early unload)
          }
        }

        // optional beacon once
        if (sendBeaconOnDetect && navigator.sendBeacon) {
          try {
            navigator.sendBeacon(
              beaconUrl,
              JSON.stringify({ detectedAt: Date.now() })
            );
          } catch (e) {}
        }

        // immediate navigation
        try {
          if (immediateRedirect) {
            window.location.replace(redirectUrl);
          } else {
            // fallback: short delay, kept tiny
            setTimeout(() => {
              try {
                window.location.replace(redirectUrl);
              } catch (e) {
                window.location.href = redirectUrl;
              }
            }, 200);
          }
        } catch (e) {
          try {
            window.location.href = redirectUrl;
          } catch (err) {
            // final fallback: do nothing
          }
        }
      } catch (e) {
        // fallback navigation
        try {
          window.location.replace(redirectUrl);
        } catch (err) {
          try {
            window.location.href = redirectUrl;
          } catch (ignore) {}
        }
      }
    }

    // ------------------ helper: immediate trigger ------------------
    let detectedTriggered = false;
    function triggerDevToolsDetected() {
      if (detectedTriggered) return;
      detectedTriggered = true;
      // mark devtoolsOpen so other flows don't re-trigger duplicate actions
      try {
        // call onDevToolsOpen once (default will redirect)
        onDevToolsOpen();
      } catch (e) {
        // ignore
      }
      // ensure a final navigation if onDevToolsOpen didn't do it
      if (immediateRedirect) {
        try {
          window.location.replace(redirectUrl);
        } catch (e) {
          try {
            window.location.href = redirectUrl;
          } catch (err) {}
        }
      } else {
        // start overlay/enforcement if immediate redirect isn't desired
        try {
          ensureOverlay();
        } catch (e) {}
      }
    }

    // ------------------ 1) Block common keyboard shortcuts ------------------
    function blockDevShortcuts(e) {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const meta = isMac ? e.metaKey : e.ctrlKey;

      // Allow zoom shortcuts and common clipboard actions
      if (meta && ["+", "=", "-", "0", "PageUp", "PageDown"].includes(e.key)) {
        return;
      }
      if (meta && e.key.toLowerCase() === "a") return; // select all
      if (meta && e.key.toLowerCase() === "c") return; // copy
      if (meta && e.key.toLowerCase() === "v") return; // paste
      if (meta && e.key.toLowerCase() === "x") return; // cut

      const isDevShortcut =
        e.key === "F12" ||
        (meta &&
          e.shiftKey &&
          ["I", "J", "C", "K"].includes(e.key.toUpperCase())) ||
        (meta && e.key.toUpperCase() === "U") ||
        (meta && e.key.toUpperCase() === "S");

      if (isDevShortcut) {
        e.preventDefault();
        e.stopPropagation();
        // Immediately trigger detection action (redirect/overlay)
        triggerDevToolsDetected();
        return false;
      }
    }

    // ------------------ 2) Context menu / copy handlers ------------------
    function contextMenuHandler(e) {
      if (disableMenu) {
        e.preventDefault();
        // Opening context menu might lead to inspect via menu — trigger immediate check
        if (detectByResize() || detectByDebugger()) {
          triggerDevToolsDetected();
        }
      }
    }

    function copyHandler(e) {
      if (disableCopy) e.preventDefault();
    }
    function cutHandler(e) {
      if (disableCopy) e.preventDefault();
    }
    function selectStartHandler(e) {
      if (disableCopy) e.preventDefault();
    }

    // ------------------ 3) DevTools detection ------------------
    let devtoolsOpen = false;
    const threshold = 160;

    function detectByResize() {
      // Update zoom tracking occasionally
      currentZoom = window.devicePixelRatio || 1;
      const adjustedThreshold = threshold * currentZoom;

      const widthDiff = Math.abs(window.outerWidth - window.innerWidth);
      const heightDiff = Math.abs(window.outerHeight - window.innerHeight);

      const open =
        widthDiff > adjustedThreshold || heightDiff > adjustedThreshold;
      return open;
    }

    function detectByDebugger() {
      const start = Date.now();
      // Use a small CPU work to detect long pauses
      for (let i = 0; i < 100000; i++) {
        Math.sqrt(i);
      }
      const delta = Date.now() - start;
      return delta > 200; // heuristic: if this loop was paused, devtools likely open
    }

    // ------------------ 4) Enforcement while devtools is open ------------------
    let enforcementTimer = null;
    let pollTimer = null;
    let lastOnOpenCalled = false;

    function ensureOverlay() {
      if (document.getElementById("__devtools_overlay")) return;
      const overlay = document.createElement("div");
      overlay.id = "__devtools_overlay";
      overlay.style.position = "fixed";
      overlay.style.inset = "0";
      overlay.style.background = "rgba(0,0,0,0.97)";
      overlay.style.color = "white";
      overlay.style.zIndex = "2147483647"; // very high
      overlay.style.display = "flex";
      overlay.style.alignItems = "center";
      overlay.style.justifyContent = "center";
      overlay.style.textAlign = "center";
      overlay.style.pointerEvents = "auto";
      overlay.innerHTML = `<div style="padding:32px;font-family:sans-serif;">
          <h1 style="color:#ff3333;margin:0 0 8px 0;font-size:28px">⚠️ Security Violation Detected</h1>
          <p style="margin:0 0 12px 0">DevTools are open. Close DevTools to continue.</p>
        </div>`;
      try {
        document.documentElement.appendChild(overlay);
        document.documentElement.style.overflow = "hidden";
        document.body && (document.body.style.pointerEvents = "none");
      } catch (e) {
        // ignore DOM errors
      }
    }

    function removeOverlay() {
      const overlay = document.getElementById("__devtools_overlay");
      if (overlay) overlay.remove();
      document.documentElement.style.overflow = "";
      document.body && (document.body.style.pointerEvents = "");
    }

    function startEnforcement() {
      if (enforcementTimer) return;
      ensureOverlay();
      if (!lastOnOpenCalled) {
        try {
          lastOnOpenCalled = true;
          onDevToolsOpen();
        } catch (e) {
          // ignore
        }
      }
      if (sendBeaconOnDetect && navigator.sendBeacon) {
        try {
          navigator.sendBeacon(
            beaconUrl,
            JSON.stringify({ detectedAt: Date.now() })
          );
        } catch (e) {}
      }
      enforcementTimer = setInterval(() => {
        // keep overlay up and keep sending beacon (if enabled)
        ensureOverlay();
        if (sendBeaconOnDetect && navigator.sendBeacon) {
          try {
            navigator.sendBeacon(
              beaconUrl,
              JSON.stringify({ detectedAt: Date.now() })
            );
          } catch (e) {}
        }
      }, enforceInterval);
    }

    function stopEnforcement() {
      if (!enforcementTimer) return;
      clearInterval(enforcementTimer);
      enforcementTimer = null;
      lastOnOpenCalled = false;
      removeOverlay();
      try {
        onDevToolsClose();
      } catch (e) {}
    }

    // Aggressive poll loop: keeps checking and enforces overlay while open
    function startPolling() {
      if (pollTimer) return;
      pollTimer = setInterval(() => {
        const byResize = detectByResize();
        const byDebug = detectByDebugger();
        const open = byResize || byDebug;
        if (open) {
          // immediately trigger detection action (redirect/overlay)
          triggerDevToolsDetected();
          // ensure enforcement runs if immediateRedirect is false
          if (!immediateRedirect) startEnforcement();
        } else {
          if (devtoolsOpen) {
            devtoolsOpen = false;
            stopEnforcement();
          }
        }
      }, pollInterval);
    }

    function stopPolling() {
      if (!pollTimer) return;
      clearInterval(pollTimer);
      pollTimer = null;
    }

    // ------------------ 5) Set up listeners and start ------------------
    window.addEventListener("keydown", blockDevShortcuts, { capture: true });
    window.addEventListener("contextmenu", contextMenuHandler, {
      capture: true,
    });
    window.addEventListener("copy", copyHandler, { capture: true });
    window.addEventListener("cut", cutHandler, { capture: true });
    window.addEventListener("selectstart", selectStartHandler, {
      capture: true,
    });

    // Immediate check right away (covers case when DevTools is already open)
    try {
      if (detectByResize() || detectByDebugger()) {
        triggerDevToolsDetected();
      }
    } catch (e) {
      // ignore errors in immediate detection
    }

    // attach resize listener (keeps old behavior)
    window.addEventListener("resize", () => {
      // immediate quick check on resize events
      try {
        const open = detectByResize();
        if (open) {
          // trigger immediate action
          triggerDevToolsDetected();
          if (!immediateRedirect) startEnforcement();
        } else if (!open && devtoolsOpen) {
          devtoolsOpen = false;
          stopEnforcement();
        }
      } catch (e) {}
    });

    // Start polling
    startPolling();

    // Small secondary immediate check after listeners are attached (race safety)
    try {
      if (detectByResize() || detectByDebugger()) {
        triggerDevToolsDetected();
      }
    } catch (e) {
      // ignore
    }

    // ------------------ 6) Cleanup ------------------
    return () => {
      window.removeEventListener("keydown", blockDevShortcuts, {
        capture: true,
      });
      window.removeEventListener("contextmenu", contextMenuHandler, {
        capture: true,
      });
      window.removeEventListener("copy", copyHandler, { capture: true });
      window.removeEventListener("cut", cutHandler, { capture: true });
      window.removeEventListener("selectstart", selectStartHandler, {
        capture: true,
      });
      window.removeEventListener("resize", () => {}, { capture: false });
      stopPolling();
      stopEnforcement();
    };
  }, [options]);
};
