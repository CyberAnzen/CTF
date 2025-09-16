// utils/devToolsBlocker.js
import { useEffect } from "react";

export const useDevToolsBlocker = (options = {}) => {
  useEffect(() => {
    // Track current zoom level
    let currentZoom = 1;

    const {
      disableMenu = true,
      disableCopy = true,
      onDevToolsOpen = defaultOnDevToolsOpen,
      onDevToolsClose = () => {},
    } = options;

    // Default action when DevTools is detected
    function defaultOnDevToolsOpen() {
      try {
        // Example: show warning and redirect after delay
        document.body.innerHTML = `
          <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: black; color: white; font-family: sans-serif;">
            <div style="text-align: center;">
              <h1 style="color: red; font-size: 3rem;">⚠️ Security Violation Detected</h1>
              <p style="font-size: 1.5rem; margin-top: 20px;">DevTools usage is not permitted on this application.</p>
              <p style="margin-top: 30px;">Redirecting in <span id="countdown">3</span> seconds...</p>
            </div>
          </div>
        `;

        // Countdown and redirect
        let count = 3;
        const countdownEl = document.getElementById("countdown");
        const interval = setInterval(() => {
          count--;
          if (countdownEl) countdownEl.textContent = count;
          if (count <= 0) {
            clearInterval(interval);
            window.location.replace("about:blank");
          }
        }, 1000);
      } catch (e) {
        // fallback
        window.location.reload();
      }
    }

    // 1) Block common keyboard shortcuts
    function blockDevShortcuts(e) {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const meta = isMac ? e.metaKey : e.ctrlKey;

      // Allow zoom shortcuts
      if (meta && ["+", "=", "-", "0", "PageUp", "PageDown"].includes(e.key)) {
        return;
      }

      // Allow Ctrl+A for select all
      if (meta && e.key.toLowerCase() === "a") {
        return;
      }

      // Allow Ctrl+C for copy
      if (meta && e.key.toLowerCase() === "c") {
        return;
      }

      if (
        e.key === "F12" ||
        (meta &&
          e.shiftKey &&
          ["I", "J", "C", "K"].includes(e.key.toUpperCase())) ||
        (meta && e.key.toUpperCase() === "U") ||
        (meta && e.key.toUpperCase() === "S")
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }

    // 2) Disable right-click / context menu if enabled
    function contextMenuHandler(e) {
      if (disableMenu) {
        e.preventDefault();
      }
    }

    // 3) Block copying if enabled
    function copyHandler(e) {
      if (disableCopy) {
        e.preventDefault();
      }
    }

    function cutHandler(e) {
      if (disableCopy) {
        e.preventDefault();
      }
    }

    function selectStartHandler(e) {
      if (disableCopy) {
        e.preventDefault();
      }
    }

    // 4) Detect DevTools open
    let devtoolsOpen = false;
    const threshold = 160;

    function detectByResize() {
      const adjustedThreshold = threshold * currentZoom;

      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;

      const open =
        widthDiff > adjustedThreshold || heightDiff > adjustedThreshold;

      if (open && !devtoolsOpen) {
        devtoolsOpen = true;
        onDevToolsOpen();
      } else if (!open && devtoolsOpen) {
        devtoolsOpen = false;
        onDevToolsClose();
      }
    }

    // Additional detection: `debugger` timing trick
    function detectByDebugger() {
      const start = Date.now();
      for (let i = 0; i < 100000; i++) {
        Math.sqrt(i) * Math.sqrt(i);
      }
      const delta = Date.now() - start;
      if (delta > 200 && !devtoolsOpen) {
        devtoolsOpen = true;
        onDevToolsOpen();
      }
    }

    // Set up event listeners
    window.addEventListener("keydown", blockDevShortcuts, { capture: true });
    window.addEventListener("contextmenu", contextMenuHandler, {
      capture: true,
    });
    window.addEventListener("copy", copyHandler, { capture: true });
    window.addEventListener("cut", cutHandler, { capture: true });
    window.addEventListener("selectstart", selectStartHandler, {
      capture: true,
    });
    window.addEventListener("resize", detectByResize);

    // Poll for DevTools
    const intervalId = setInterval(() => {
      detectByResize();
      detectByDebugger();
    }, 1000);

    // Cleanup function
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
      window.removeEventListener("resize", detectByResize);
      clearInterval(intervalId);
    };
  }, [options]);
};
