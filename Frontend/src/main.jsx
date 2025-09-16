// main.jsx
import { BrowserRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AppContextProvider } from "./context/AppContext.jsx";
import { SocketProvider } from "./context/useSocket";
import FaultyTerminal from "./components/Background.jsx";
import { useState, useEffect } from "react";
import { useDevToolsBlocker } from "../utils/Devtools.js"; // keep your import as-is
import "../utils/disable.js"; // keep your import as-is
function Root() {
  // Initialize the DevTools blocker INSIDE a React component (valid hook call)
  // useDevToolsBlocker({
  //   disableMenu: true,
  //   disableCopy: true,
  //   onDevToolsOpen: () => {
  //     console.log("DevTools detected!");
  //   },
  // });

  const [animationsEnabled, setAnimationsEnabled] = useState(() => {
    const stored = localStorage.getItem("animationOff");
    if (stored === null) return true; // default ON
    return stored !== "true";
  });

  useEffect(() => {
    const syncStorage = () => {
      setAnimationsEnabled(localStorage.getItem("animationOff") !== "true");
    };

    window.addEventListener("storage", syncStorage);
    window.addEventListener("animationToggle", syncStorage);

    return () => {
      window.removeEventListener("storage", syncStorage);
      window.removeEventListener("animationToggle", syncStorage);
    };
  }, []);

  return (
    <BrowserRouter>
      <AppContextProvider>
        <SocketProvider>
          {animationsEnabled && (
            <div className="fixed inset-0 -z-10">
              <FaultyTerminal
                scale={5}
                gridMul={[3, 19]}
                digitSize={1.2}
                timeScale={0.3}
                scanlineIntensity={0.8}
                tint="#17565c"
                brightness={0.4}
                maxFps={15}
                adaptiveQuality={true}
              />
            </div>
          )}
          <div
            className={`fixed inset-0 bg-gradient-to-b ${
              animationsEnabled
                ? "from-black/0 to-black/0 backdrop-saturate-900 "
                : "from-black to-gray-900 backdrop-saturate-200"
            } border border-[#01ffdb]/10 shadow-2xl -z-10`}
          />
          <App />
        </SocketProvider>
      </AppContextProvider>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")).render(<Root />);
