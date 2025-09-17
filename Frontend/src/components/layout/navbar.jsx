import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  BookOpen,
  Trophy,
  Menu,
  X,
  Radar,
  User,
  UserCircle,
  Terminal,
  Code2,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "../../context/AppContext";
import Logo from "./Logo";
import { BugAntIcon } from "@heroicons/react/24/solid";

// Device detection utility
const useDeviceDetection = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    type: "desktop",
    os: "unknown",
    screenSize: "large",
    isTouch: false,
    orientation: "landscape",
    pixelRatio: 1,
  });

  useEffect(() => {
    const detectDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const userAgent = navigator.userAgent.toLowerCase();
      const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const pixelRatio = window.devicePixelRatio || 1;

      let type = "desktop";
      let os = "unknown";
      let screenSize = "large";

      // Device type detection
      if (width <= 480) {
        type = "mobile";
        screenSize = "small";
      } else if (width <= 768) {
        type = "tablet";
        screenSize = "medium";
      } else if (width <= 1024) {
        type = "laptop";
        screenSize = "large";
      } else if (width <= 1440) {
        type = "desktop";
        screenSize = "xlarge";
      } else {
        type = "tv";
        screenSize = "xxlarge";
      }

      // OS detection
      if (userAgent.includes("iphone") || userAgent.includes("ipad")) {
        os = "ios";
      } else if (userAgent.includes("android")) {
        os = "android";
      } else if (userAgent.includes("mac")) {
        os = "macos";
      } else if (userAgent.includes("windows")) {
        os = "windows";
      } else if (userAgent.includes("linux")) {
        os = "linux";
      }

      // Specific device detection
      if (
        userAgent.includes("ipad") ||
        (userAgent.includes("mac") && isTouch)
      ) {
        type = "tablet";
        os = "ios";
      }

      const orientation = width > height ? "landscape" : "portrait";

      setDeviceInfo({
        type,
        os,
        screenSize,
        isTouch,
        orientation,
        pixelRatio,
      });
    };

    detectDevice();
    window.addEventListener("resize", detectDevice);
    window.addEventListener("orientationchange", detectDevice);

    return () => {
      window.removeEventListener("resize", detectDevice);
      window.removeEventListener("orientationchange", detectDevice);
    };
  }, []);

  return deviceInfo;
};

const Navbar = () => {
  const { loggedIn } = useAppContext();
  const location = useLocation();
  const deviceInfo = useDeviceDetection();

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navbarVisible, setNavbarVisible] = useState(true);
  const [bottomVisible, setBottomVisible] = useState(true);
  const [isIdle, setIsIdle] = useState(false);
  const [scrollDirection, setScrollDirection] = useState("up");

  const lastScrollY = useRef(0);
  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);
  const idleTimer = useRef(null);
  const lastActivity = useRef(Date.now());
  const scrollTimeout = useRef(null);

  const blacklistRoutes = ["/login", "/forget-password", "/signup"];
  const isBlacklisted = blacklistRoutes.some((route) =>
    location.pathname.startsWith(route)
  );

  const menublacklist = ["/lesson/"];
  const ismenuBlacklisted = menublacklist.some((route) =>
    location.pathname.startsWith(route)
  );

  // Device-specific configurations
  const getDeviceConfig = () => {
    const { type, os, screenSize, isTouch } = deviceInfo;

    const configs = {
      mobile: {
        topNavHeight: "py-1",
        bottomNavPadding: "px-1 py-4",
        iconSize: "w-3.5 h-3.5",
        fontSize: "text-xs",
        borderRadius: "rounded-xl",
        blur: "backdrop-blur-xl",
        spacing: "gap-0.5",
        padding: "px-1.5",
        margin: "bottom-1",
      },
      tablet: {
        topNavHeight: "py-1.5",
        bottomNavPadding: "px-1.5 py-1.5",
        iconSize: "w-4 h-4",
        fontSize: "text-xs",
        borderRadius: "rounded-2xl",
        blur: "backdrop-blur-2xl",
        spacing: "gap-1",
        padding: "px-2",
        margin: "bottom-1.5",
      },
      laptop: {
        topNavHeight: "py-1.5",
        bottomNavPadding: "px-2 py-1.5",
        iconSize: "w-4 h-4",
        fontSize: "text-sm",
        borderRadius: "rounded-2xl",
        blur: "backdrop-blur-2xl",
        spacing: "gap-1.5",
        padding: "px-3",
        margin: "bottom-2",
      },
      desktop: {
        topNavHeight: "py-2",
        bottomNavPadding: "px-2.5 py-2",
        iconSize: "w-4.5 h-4.5",
        fontSize: "text-sm",
        borderRadius: "rounded-full",
        blur: "backdrop-blur-2xl",
        spacing: "gap-2",
        padding: "px-4",
        margin: "bottom-2",
      },
      tv: {
        topNavHeight: "py-2.5",
        bottomNavPadding: "px-3 py-2.5",
        iconSize: "w-5 h-5",
        fontSize: "text-base",
        borderRadius: "rounded-full",
        blur: "backdrop-blur-3xl",
        spacing: "gap-3",
        padding: "px-5",
        margin: "bottom-3",
      },
    };

    return configs[type] || configs.desktop;
  };

  const config = getDeviceConfig();

  // Idle detection functions
  const resetIdleTimer = () => {
    lastActivity.current = Date.now();
    setIsIdle(false);

    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
    }

    // Adjust idle timeout based on device type
    const idleTimeout = deviceInfo.type === "mobile" ? 20000 : 30000;
    idleTimer.current = setTimeout(() => {
      setIsIdle(true);
    }, idleTimeout);
  };

  const handleUserActivity = () => {
    resetIdleTimer();
    if (isIdle) {
      setNavbarVisible(true);
      setBottomVisible(true);
    }
  };

  // Throttle function with device-adaptive timing
  function throttle(func, limit) {
    let inThrottle;
    return function () {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  // Effect for idle detection
  useEffect(() => {
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "touchmove",
      "click",
      "wheel",
    ];

    // Adjust throttle timing based on device performance
    const throttleTime = deviceInfo.type === "mobile" ? 150 : 100;
    const throttledActivity = throttle(handleUserActivity, throttleTime);

    events.forEach((event) => {
      document.addEventListener(event, throttledActivity, { passive: true });
    });

    resetIdleTimer();

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, throttledActivity);
      });
      if (idleTimer.current) {
        clearTimeout(idleTimer.current);
      }
    };
  }, [isIdle, deviceInfo.type]);

  // Effect for hiding navbar when idle
  useEffect(() => {
    if (isIdle) {
      setNavbarVisible(false);
      setBottomVisible(false);
    } else {
      setNavbarVisible(true);
      // Bottom nav visibility is controlled by scroll direction when not idle
      if (scrollDirection === "up" || lastScrollY.current < 100) {
        setBottomVisible(true);
      }
    }
  }, [isIdle, scrollDirection]);

  // Enhanced scroll detection with smooth hiding/showing
  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const onTouchStart = (e) => {
      touchStartY.current = e.touches[0].clientY;
      touchCurrentY.current = touchStartY.current;
    };

    const onTouchMove = (e) => {
      touchCurrentY.current = e.touches[0].clientY;
    };

    const onTouchEnd = () => {
      if (isIdle) return;

      const touchDiff = touchStartY.current - touchCurrentY.current;
      const threshold = deviceInfo.type === "mobile" ? 30 : 50;

      if (Math.abs(touchDiff) > threshold) {
        if (touchDiff > 0) {
          // Scrolling down
          setScrollDirection("down");
          setBottomVisible(false);
        } else {
          // Scrolling up
          setScrollDirection("up");
          setBottomVisible(true);
        }
      }
    };

    const onWheel = (e) => {
      if (isIdle) return;

      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      const threshold = deviceInfo.type === "mobile" ? 5 : 10;

      if (e.deltaY > threshold) {
        setScrollDirection("down");
        setBottomVisible(false);
      } else if (e.deltaY < -threshold) {
        setScrollDirection("up");
        setBottomVisible(true);
      }

      // Show bottom nav after scroll stops
      scrollTimeout.current = setTimeout(() => {
        if (window.scrollY < 100) {
          setBottomVisible(true);
        }
      }, 1000);
    };

    const onScroll = () => {
      if (isIdle) return;

      const currentY = window.scrollY;
      const scrollDiff = currentY - lastScrollY.current;

      setScrolled(currentY > 20);

      // Improved scroll direction detection
      if (Math.abs(scrollDiff) > 5) {
        if (scrollDiff > 0 && currentY > 100) {
          // Scrolling down and past threshold
          setScrollDirection("down");
          setBottomVisible(false);
        } else if (scrollDiff < 0 || currentY < 50) {
          // Scrolling up or near top
          setScrollDirection("up");
          setBottomVisible(true);
        }
      }

      lastScrollY.current = currentY;

      // Clear any existing timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      // Show bottom nav after scroll stops
      scrollTimeout.current = setTimeout(
        () => {
          if (!isIdle) {
            setBottomVisible(true);
          }
        },
        deviceInfo.type === "mobile" ? 800 : 1200
      );
    };

    if (deviceInfo.isTouch) {
      window.addEventListener("touchstart", onTouchStart, { passive: true });
      window.addEventListener("touchmove", onTouchMove, { passive: true });
      window.addEventListener("touchend", onTouchEnd);
    }

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onScroll);

      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [isIdle, deviceInfo]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "auto";
      document.body.style.touchAction = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
      document.body.style.touchAction = "auto";
    };
  }, [mobileMenuOpen]);

  const navItems = [
    { name: "Learn", icon: BookOpen, path: "/learn" },

    { name: "Challenges", icon: Code2, path: "/challenge" },
    { name: "Leaderboard", icon: Radar, path: "/leaderboard" },

    loggedIn
      ? { name: "Profile", icon: UserCircle, path: "/profile" }
      : { name: "Login", icon: User, path: "/login" },
    // { name: "About", icon: Info, path: "/about" },
  ];

  // Device-specific animation configurations
  const getAnimationConfig = () => {
    const baseConfig = {
      type: "spring",
      stiffness: 300,
      damping: 30,
    };

    if (deviceInfo.type === "mobile") {
      return {
        ...baseConfig,
        stiffness: 400,
        damping: 35,
      };
    } else if (deviceInfo.type === "tv") {
      return {
        ...baseConfig,
        stiffness: 250,
        damping: 25,
      };
    }

    return baseConfig;
  };

  const animationConfig = getAnimationConfig();

  return (
    <>
      {/* Top Glass Navbar */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{
          y: navbarVisible && !isIdle ? 0 : -100,
          opacity: navbarVisible && !isIdle ? 1 : 0,
        }}
        transition={{
          ...animationConfig,
          opacity: { duration: 0.2 },
        }}
        className={`fixed w-full top-0 z-50 ${config.padding} pt-2 sm:pt-4`}
      >
        <div
          className={`container mx-auto max-w-6xl transition-all duration-500 ease-out ${
            scrolled ? config.topNavHeight : "py-2 sm:py-4"
          } bg-black/50 ${config.blur} border border-[#00ffff]/15 ${
            config.borderRadius
          } shadow-[0_4px_20px_rgba(0,0,0,0.6),0_0_0_1px_rgba(0,255,255,0.08)] hover:shadow-[0_6px_25px_rgba(0,255,255,0.2)] hover:border-[#00ffff]/25 hover:bg-black/60`}
        >
          <div
            className={`flex justify-between items-center ${config.padding}`}
          >
            <Logo />

            {/* Desktop Navigation */}
            <div className={`hidden md:flex items-center ${config.spacing}`}>
              {navItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className="relative px-2 py-1.5 group"
                  >
                    <motion.div
                      className={`absolute inset-0 ${config.borderRadius} ${
                        active
                          ? "bg-gradient-to-r from-[#00ffff]/15 via-[#0080ff]/10 to-[#00ffff]/15 border border-[#00ffff]/30"
                          : "bg-transparent hover:bg-white/3 hover:border hover:border-white/8"
                      } transition-all duration-300`}
                      whileHover={{ scale: 1.05 }}
                      transition={animationConfig}
                    />
                    <div
                      className={`relative flex items-center ${config.spacing.replace(
                        "gap-",
                        "gap-"
                      )}`}
                    >
                      <item.icon
                        className={`${config.iconSize} ${
                          active
                            ? "text-[#00ffff] drop-shadow-[0_0_6px_rgba(0,255,255,0.6)]"
                            : "text-white/60 group-hover:text-[#00ffff] group-hover:drop-shadow-[0_0_4px_rgba(0,255,255,0.4)]"
                        } transition-all duration-300`}
                      />
                      <span
                        className={`${config.fontSize} font-medium ${
                          active
                            ? "text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.6)]"
                            : "text-white/60 group-hover:text-white"
                        } transition-all duration-300`}
                      >
                        {item.name}
                      </span>
                    </div>
                    {active && (
                      <motion.span
                        className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-0.5 h-0.5 bg-[#00ffff] rounded-full shadow-[0_0_4px_rgba(0,255,255,0.6)]"
                        layoutId="navbar-indicator"
                        transition={animationConfig}
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Mobile Menu Button */}
            {!ismenuBlacklisted && (
              <motion.button
                className={`md:hidden relative p-1.5 ${config.borderRadius} overflow-hidden group bg-white/3 border border-white/8 hover:bg-white/8 hover:border-[#00ffff]/20`}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-r from-[#00ffff]/3 to-[#0080ff]/3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${config.borderRadius}`}
                />
                <AnimatePresence mode="wait">
                  {mobileMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X
                        className={`${config.iconSize} text-white relative z-10`}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu
                        className={`${config.iconSize} text-white relative z-10`}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            )}
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className={`fixed inset-0 z-40 bg-black/95 ${config.blur} md:hidden`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              className={`absolute right-2 sm:right-4 top-2 sm:top-4 bottom-2 sm:bottom-4 ${
                deviceInfo.type === "mobile" ? "w-64 sm:w-72" : "w-72 sm:w-80"
              } bg-black/70 ${
                config.blur
              } border border-[#00ffff]/15 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.7)]`}
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={animationConfig}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col p-3 pt-14 h-full">
                {navItems.map((item, index) => {
                  const active = isActive(item.path);
                  return (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        to={item.path}
                        className={`flex items-center gap-2.5 px-3 py-2.5 my-0.5 rounded-xl transition-all duration-300 relative overflow-hidden group border ${
                          active
                            ? "bg-gradient-to-r from-[#00ffff]/8 to-[#0080ff]/8 text-white border-[#00ffff]/20"
                            : "text-white/60 hover:text-white border-transparent hover:border-white/8 hover:bg-white/3"
                        }`}
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-[#00ffff]/3 to-[#0080ff]/3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"
                          whileHover={{ scale: 1.02 }}
                        />
                        <item.icon
                          className={`${config.iconSize} relative z-10 ${
                            active
                              ? "text-[#00ffff] drop-shadow-[0_0_4px_rgba(0,255,255,0.6)]"
                              : "group-hover:text-[#00ffff] group-hover:drop-shadow-[0_0_3px_rgba(0,255,255,0.4)]"
                          } transition-all duration-300`}
                        />
                        <span
                          className={`font-medium relative z-10 ${config.fontSize}`}
                        >
                          {item.name}
                        </span>
                        {active && (
                          <motion.div
                            className="w-1.5 h-1.5 bg-[#00ffff] rounded-full ml-auto shadow-[0_0_4px_rgba(0,255,255,0.6)]"
                            layoutId="sidebar-indicator"
                          />
                        )}
                      </Link>
                    </motion.div>
                  );
                })}

                <div className="mt-auto pt-4 border-t border-white/8">
                  <div
                    className={`${
                      config.fontSize === "text-base"
                        ? "text-xs"
                        : "text-[10px]"
                    } text-white/30 font-mono`}
                  >
                    © 2025 CyberAnzen
                  </div>
                  {process.env.NODE_ENV === "development" && (
                    <div className="text-[10px] text-white/20 font-mono">
                      {deviceInfo.type} • {deviceInfo.os} •{" "}
                      {deviceInfo.screenSize}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navbar for Mobile */}
      {!isBlacklisted && (
        <motion.div
          className={`fixed ${
            config.margin.includes("bottom") ? config.margin : "bottom-1.5"
          } left-1.5 right-1.5 md:hidden z-30`}
          initial={{ y: 100, opacity: 0 }}
          animate={{
            y: bottomVisible && !isIdle ? 0 : 100,
            opacity: bottomVisible && !isIdle ? 1 : 0,
          }}
          transition={{
            ...animationConfig,
            opacity: { duration: 0.3 },
          }}
        >
          <div
            className={`bg-black/70 ${config.blur} border border-[#00ffff]/12 ${config.borderRadius} ${config.bottomNavPadding} shadow-[0_4px_20px_rgba(0,0,0,0.6)]`}
          >
            <div className="flex justify-around">
              {navItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`relative flex flex-col items-center px-1 py-0.5 group`}
                  >
                    <motion.div
                      whileTap={{ scale: 0.9 }}
                      whileHover={{ scale: 1.1 }}
                      className={`relative p-1.5 ${
                        config.borderRadius
                      } transition-all duration-300 border ${
                        active
                          ? "bg-gradient-to-r from-[#00ffff]/15 to-[#0080ff]/15 border-[#00ffff]/20"
                          : "group-hover:bg-white/6 border-transparent group-hover:border-white/8"
                      }`}
                    >
                      {active && (
                        <motion.div
                          className={`absolute inset-0 bg-gradient-to-r from-[#00ffff]/8 to-[#0080ff]/8 ${config.borderRadius}`}
                          layoutId="mobile-nav-background"
                          transition={animationConfig}
                        />
                      )}
                      <item.icon
                        className={`${
                          config.iconSize
                        } relative z-10 transition-all duration-300 ${
                          active
                            ? "text-[#00ffff] drop-shadow-[0_0_4px_rgba(0,255,255,0.6)]"
                            : "text-white/50 group-hover:text-[#00ffff] group-hover:drop-shadow-[0_0_3px_rgba(0,255,255,0.4)]"
                        }`}
                      />
                    </motion.div>
                    <span
                      className={`${
                        config.fontSize
                      } mt-0.5 font-medium transition-all duration-300 ${
                        active
                          ? "text-white"
                          : "text-white/50 group-hover:text-white"
                      }`}
                    >
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
};

export default React.memo(Navbar);
