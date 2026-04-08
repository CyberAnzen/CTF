import React, { useState, useEffect, useRef } from "react";
import { User, Lock, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ParticleBackground from "../components/Login/ParticleBackground";
import FingerprintIcon from "../components/Login/FingerprintIcon";
import { useAppContext } from "../context/AppContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function LoginPage() {
  const navigate = useNavigate();
  const { loggedIn, setLoggedIn, User, fetchProfile } = useAppContext();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { fp } = useAppContext();
  const [showSubmit, setShowSubmit] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const onContext = (e) => e.preventDefault();
    el.addEventListener("contextmenu", onContext, true); // capture phase
    return () => el.removeEventListener("contextmenu", onContext, true);
  }, []);

  useEffect(() => {
    if (loggedIn || User) {
      fetchProfile();
      navigate("/profile");
    }
  }, [loggedIn, User, navigate]);

  useEffect(() => {
    // Smooth scroll to top
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });

    // Enhanced device detection
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    const isDesktop = window.innerWidth >= 1024;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    // Improved scroll handling based on device type
    if (isDesktop) {
      // Lock scroll only on desktop
      document.body.style.overflow = "hidden";
      document.body.style.height = "100vh";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.documentElement.style.overflow = "hidden";
    } else if (isTablet) {
      // Allow natural scrolling on tablets but prevent bounce
      document.body.style.overscrollBehavior = "none";
      document.documentElement.style.overscrollBehavior = "none";
    } else {
      // Mobile: Allow full scrolling but prevent pull-to-refresh
      document.body.style.overscrollBehavior = "none";
      document.body.style.touchAction = "pan-y";
      document.documentElement.style.overscrollBehavior = "none";
    }

    // Enhanced touch handling for different platforms
    const preventTouchMove = (e) => {
      const target = e.target;
      const scrollableParent = target.closest(
        ".overflow-y-auto, .overflow-auto, .scroll-container"
      );

      if (isDesktop && !scrollableParent) {
        e.preventDefault();
      } else if (isIOS && !scrollableParent) {
        // Special iOS handling
        const scrollY = window.pageYOffset;
        const maxScroll =
          document.documentElement.scrollHeight - window.innerHeight;
        if (scrollY <= 0 || scrollY >= maxScroll) {
          e.preventDefault();
        }
      }
    };

    // Prevent iOS bounce and Android pull-to-refresh
    const preventBounce = (e) => {
      if ((isIOS || isAndroid) && !isMobile) {
        const target = e.target;
        const scrollableParent = target.closest(
          ".overflow-y-auto, .overflow-auto"
        );
        if (!scrollableParent) {
          e.preventDefault();
        }
      }
    };

    // Add event listeners with proper passive flags
    document.addEventListener("touchmove", preventTouchMove, {
      passive: false,
    });
    document.addEventListener("touchstart", preventBounce, { passive: false });

    // Handle different browser behaviors
    if (isSafari) {
      document.body.style.webkitOverflowScrolling = "touch";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "";
      document.body.style.height = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.overscrollBehavior = "";
      document.body.style.touchAction = "";
      document.body.style.webkitOverflowScrolling = "";
      document.documentElement.style.overflow = "";
      document.documentElement.style.overscrollBehavior = "";
      document.removeEventListener("touchmove", preventTouchMove);
      document.removeEventListener("touchstart", preventBounce);
    };
  }, []);

  // Show submit button automatically after component mounts
  useEffect(() => {
    const t = setTimeout(() => setShowSubmit(true), 300);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", timestamp: Date.now() },
        credentials: "include",
        body: JSON.stringify({
          identifier: username,
          password,
          rememberMe,
          fp,
        }),
      });

      const data = await res.json();
      console.log(data);
      if (data.message === "Login successful") {
        setLoggedIn(true);
        navigate("/");
      } else {
        setError(data.message || "Access Denied: Authentication Failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("System Error: Connection Failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center px-2 sm:px-4 lg:px-6 relative min-h-screen overflow-y-auto pt-4 sm:pt-6 lg:pt-10 pb-4 sm:pb-6 lg:pb-0 scroll-container">
      <ParticleBackground />
      {/* Cyberpunk grid overlay */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
            linear-gradient(rgba(1, 255, 219, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(1, 255, 219, 0.1) 1px, transparent 1px)
          `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="  -mt-40  z-10 w-full max-w-6xl lg:max-h-[85vh] xl:max-h-[80vh]">
        {/* Main Container */}
        <div className="relative">
          {/* Angled border container */}
          <div
            className="relative bg-teal-700/20 opacity-85 backdrop-blur-xl border-2 border-[#01ffdb]/50 p-1"
            style={{
              clipPath:
                "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))",
            }}
          >
            {/* Inner content area */}
            <div
              className="bg-gray-900/50 p-4 sm:p-6 lg:p-8 xl:p-12 overflow-y-auto max-h-[calc(100vh-4rem)] sm:max-h-[calc(100vh-6rem)] lg:max-h-[80vh]"
              style={{
                clipPath:
                  "polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 18px 100%, 0 calc(100% - 18px))",
                scrollbarWidth: "thin",
                scrollbarColor: "#01ffdb40 transparent",
              }}
            >
              {/* LOG IN Header */}
              <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-20">
                <div
                  className="bg-[#01ffdb] text-black px-2 sm:px-4 py-1 font-mono font-bold text-sm sm:text-lg tracking-wider"
                  style={{
                    clipPath:
                      "polygon(0 0, calc(100% - 8px) 0, 100% 100%, 0 100%)",
                  }}
                >
                  LOG IN
                </div>
              </div>

              <div className="flex flex-col lg:flex-row items-center justify-center gap-6 sm:gap-8 lg:gap-12 xl:gap-16 mt-8 sm:mt-10 lg:mt-12">
                {/* Left side - Fingerprint Scanner - Hidden on mobile/tablet */}
                <div className="hidden lg:block flex-shrink-0">
                  <div className="relative">
                    {/* Scanning frame */}
                    <div className="w-40 xl:w-48 h-40 xl:h-48 border-2 border-[#01ffdb]/70 relative bg-black/30 backdrop-blur-sm">
                      {/* Corner brackets */}
                      <div className="absolute top-0 left-0 w-6 xl:w-8 h-6 xl:h-8 border-t-4 border-l-4 border-[#01ffdb]" />
                      <div className="absolute top-0 right-0 w-6 xl:w-8 h-6 xl:h-8 border-t-4 border-r-4 border-[#01ffdb]" />
                      <div className="absolute bottom-0 left-0 w-6 xl:w-8 h-6 xl:h-8 border-b-4 border-l-4 border-[#01ffdb]" />
                      <div className="absolute bottom-0 right-0 w-6 xl:w-8 h-6 xl:h-8 border-b-4 border-r-4 border-[#01ffdb]" />

                      {/* Fingerprint Icon */}
                      <div className="absolute inset-3 xl:inset-4 flex items-center justify-center">
                        <FingerprintIcon size={120} className="xl:scale-110" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side - Form */}
                <div className="w-full max-w-md lg:max-w-lg">
                  <form
                    onSubmit={handleSubmit}
                    className="space-y-4 sm:space-y-6"
                  >
                    {error && (
                      <div
                        className="bg-red-500/10 border border-red-500/50 p-3"
                        style={{
                          clipPath:
                            "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
                        }}
                      >
                        <p className="text-center text-xs sm:text-sm text-red-400 font-mono">
                          {error}
                        </p>
                      </div>
                    )}

                    {/* Username Field */}
                    <div className="space-y-2">
                      <div className="relative">
                        <div
                          className="bg-[#01ffdb]/20 border border-[#01ffdb]/50 backdrop-blur-sm"
                          style={{
                            clipPath:
                              "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
                          }}
                        >
                          <div className="flex items-center justify-between p-2 sm:p-3">
                            <input
                              type="text"
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              placeholder="USERNAME"
                              required
                              className="bg-transparent text-[#01ffdb] font-mono text-sm sm:text-base lg:text-lg placeholder:text-[#01ffdb]/60 outline-none flex-1"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Password Field */}
                    <div className="space-y-2">
                      <div className="relative">
                        <div
                          className="bg-[#01ffdb]/20 border border-[#01ffdb]/50 backdrop-blur-sm"
                          style={{
                            clipPath:
                              "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
                          }}
                        >
                          <div className="flex items-center justify-between p-2 sm:p-3">
                            <input
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="••••••••••••••••"
                              required
                              className="bg-transparent text-[#01ffdb] font-mono text-sm sm:text-base lg:text-lg placeholder:text-[#01ffdb]/60 outline-none flex-1"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Options */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 text-xs sm:text-sm">
                      <div className="flex items-center">
                        <input
                          id="remember-me"
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 bg-transparent border-2 border-[#01ffdb]/50 rounded-none 
                                     checked:bg-[#01ffdb] checked:border-[#01ffdb] 
                                     focus:ring-[#01ffdb]/50 focus:ring-2"
                        />
                        <label
                          htmlFor="remember-me"
                          className="ml-2 text-[#01ffdb]/70 font-mono"
                        >
                          PERSIST SESSION
                        </label>
                      </div>

                      <Link to="/privacy-policy">
                        <div className="text-[#01ffdb] hover:text-[#01ffdb]/80 transition-colors font-mono">
                          PRIVACY POLICY
                        </div>
                      </Link>
                    </div>

                    {/* Submit Button */}
                    <div
                      className={`transition-all duration-700 ease-out transform ${
                        showSubmit
                          ? "opacity-100 translate-y-0"
                          : "opacity-0 -translate-y-6 pointer-events-none"
                      }`}
                      style={{ willChange: "opacity, transform" }}
                    >
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="cyber-button w-full py-2 sm:py-3 px-4 sm:px-6 bg-[#01ffdb]/10 border-2 border-[#01ffdb]/50
                                 text-[#01ffdb] font-mono text-sm sm:text-base lg:text-lg font-bold
                                 hover:bg-[#01ffdb]/20 hover:border-[#01ffdb]
                                 transition-all duration-300 relative
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          clipPath:
                            "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
                        }}
                      >
                        <div className="relative z-10">
                          {isLoading
                            ? "AUTHENTICATING..."
                            : "INITIALIZE SESSION"}
                        </div>

                        {/* Animated background effect */}
                        <div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-[#01ffdb]/10 to-transparent 
                                      transform -skew-x-12 -translate-x-full animate-pulse"
                        />
                      </button>
                    </div>

                    {/* Sign up link */}
                    <div className="text-center text-[#01ffdb]/70 font-mono text-xs sm:text-sm">
                      NEW USER?{" "}
                      <Link to="/signup">
                        <span className="text-[#01ffdb] hover:text-[#01ffdb]/80 transition-colors font-bold">
                          CREATE ACCOUNT
                        </span>
                      </Link>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Glowing effect around the container */}
          <div className="absolute inset-0 bg-[#01ffdb]/5 blur-xl -z-10" />
        </div>
      </div>
    </div>
  );
}
