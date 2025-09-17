import { React, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  BookOpen,
  Trophy,
  ArrowRight,
  Users,
  Globe,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function HomePage() {
  const heroSectionRef = useRef();
  const featuresSectionRef = useRef();
  const touchStartY = useRef(null);
  const isScrolling = useRef(false);
  const [heroCollapsed, setHeroCollapsed] = useState(false);

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  useEffect(() => {
    // Initially lock page scroll so hero sits on top of everything
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleScroll = (behavior = "smooth") => {
      if (isScrolling.current || heroCollapsed) return;
      isScrolling.current = true;

      // Collapse hero quickly and smoothly
      setHeroCollapsed(true);

      // Immediately allow scrolling on the body and scroll to content
      document.body.style.overflow = prevOverflow || "";
      // scroll the page to the next section so there's no visual gap
      window.scrollTo({
        top: window.innerHeight,
        behavior: behavior,
      });

      // unlock the wheel after animation completes (shorter because we want it faster)
      setTimeout(() => {
        isScrolling.current = false;
      }, 600); // matches the faster transition below
    };

    const handleWheel = (e) => {
      if (e.deltaY > 0 && !isScrolling.current && !heroCollapsed) {
        e.preventDefault();
        handleScroll();
      }
    };

    const handleTouchStart = (e) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      if (!touchStartY.current || isScrolling.current || heroCollapsed) return;

      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY.current - touchY; // Inverted calculation

      // Increased threshold for iOS and reduced sensitivity
      if (deltaY > 30) {
        // Swipe up detected
        e.preventDefault();
        handleScroll();
        touchStartY.current = null;
      }
    };

    const hero = heroSectionRef.current;
    if (hero) {
      // Make hero sit on top of everything initially
      hero.style.touchAction = "none"; // Disable default touch actions
      hero.addEventListener("wheel", handleWheel, { passive: false });
      hero.addEventListener("touchstart", handleTouchStart, { passive: false });
      hero.addEventListener("touchmove", handleTouchMove, { passive: false });
    }

    return () => {
      document.body.style.overflow = prevOverflow || "";
      if (hero) {
        hero.style.touchAction = "";
        hero.removeEventListener("wheel", handleWheel);
        hero.removeEventListener("touchstart", handleTouchStart);
        hero.removeEventListener("touchmove", handleTouchMove);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add scroll listener to toggle hero state when user scrolls back to top
  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY === 0) {
        // Slide hero back down (hero visible again)
        setHeroCollapsed(false);
        // Re-lock body scrolling briefly to keep hero behavior consistent
        // (only if you want the original lock behavior on returning to top)
        // Note: we avoid changing overflow here to keep UX smooth with app-level navbar
      } else if (window.scrollY > 10) {
        setHeroCollapsed(true);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Add iOS-specific scroll lock
  useEffect(() => {
    document.body.style.overscrollBehavior = "contain";
    return () => {
      document.body.style.overscrollBehavior = "";
    };
  }, []);

  useEffect(() => {
    // Ensure at first load we are at top and hero visible
    window.scrollTo({
      top: 0,
      behavior: "auto",
    });
  }, []);

  return (
    <div className=" text-white">
      {/* Hero Section - Landing Page (fixed on top, will translate out on collapse) */}
      <section
        ref={heroSectionRef}
        className={`min-h-screen w-full overflow-hidden fixed inset-0 z-40 transform transition-transform duration-500 ease-in-out ${
          heroCollapsed ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="absolute blur inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80"
            alt="Cybersecurity Background"
            className="w-full h-full object-cover"
            style={{ filter: "brightness(0.3)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/70" />
        </div>
        <div className="absolute inset-0 transition-all duration-500 ease-in-out" />

        <div className="container mx-auto px-6 h-screen flex items-center relative z-10">
          <motion.div
            className="max-w-3xl mx-auto md:mx-0 md:ml-[3%]"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
              Welcome to <span className="text-[#01ffdb]">CyberAnzen</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-8 leading-relaxed">
              Your gateway to cybersecurity excellence. Explore, learn, and
              master the skills needed to secure the digital frontier.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/login">
                <motion.button
                  className="cyber-button w-full md:w-auto font-bold py-3 px-8 bg-[#01ffdb]/10 border border-[#01ffdb]/50 text-[#01ffdb] rounded-lg hover:bg-[#01ffdb]/20 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex gap-3 items-center">
                    <span>Get Started</span>
                    <ArrowRight size={20} />
                  </div>
                </motion.button>
              </Link>
              <Link to="/leaderboard">
                <motion.button
                  className="bg-transparent border border-[#01ffdb] text-[#01ffdb] cyber-button w-full md:w-auto font-bold py-3 px-8 rounded-lg hover:bg-[#01ffdb]/10 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  LeaderBoard
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Scrollable Content Below - pushed down by 100vh so hero covers first */}
      <div
        className="relative z-20"
        ref={featuresSectionRef}
        style={{ marginTop: "100vh" }}
      >
        {/* Features Section */}
        <section className="py-20 bg-transparent">
          <div className="container mx-auto px-6">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold mb-4">
                Why Choose CyberAnzen?
              </h2>
              <div className="w-24 h-1 bg-[#01ffdb] mx-auto mb-8"></div>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Join a community dedicated to exploring and mastering
                cybersecurity through hands-on learning and real-world
                challenges.
              </p>
            </motion.div>

            <motion.div
              className="grid md:grid-cols-3 gap-8"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              <motion.div
                className="bg-gradient-to-b from-black/10 via-gray-700/30 to-black/30 backdrop-blur-lg p-8 rounded-xl border-2 border-gray-700 hover:border-[#01ffdb]/30 transition-all group"
                variants={fadeIn}
                whileHover={{ y: -10 }}
              >
                <div className="bg-[#01ffdb]/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6 group-hover:bg-[#01ffdb]/20 transition-colors">
                  <BookOpen className="text-[#01ffdb]" size={28} />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  Comprehensive Learning
                </h3>
                <p className="text-gray-300 mb-4">
                  Access structured courses, workshops, and resources designed
                  to build your cybersecurity skills from the ground up.
                </p>
                <Link to="/learn">
                  <h2 className="text-[#01ffdb] flex items-center gap-2 group-hover:gap-3 transition-all">
                    Explore courses <ArrowRight size={16} />
                  </h2>
                </Link>
              </motion.div>

              <motion.div
                className="bg-gradient-to-b from-black/10 via-gray-700/30 to-black/30 backdrop-blur-lg p-8 rounded-xl border-2 border-gray-700 hover:border-[#01ffdb]/30 transition-all group"
                variants={fadeIn}
                whileHover={{ y: -10 }}
              >
                <div className="bg-[#01ffdb]/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6 group-hover:bg-[#01ffdb]/20 transition-colors">
                  <Trophy className="text-[#01ffdb]" size={28} />
                </div>
                <h3 className="text-xl font-semibold mb-3">Capture The Flag</h3>
                <p className="text-gray-300 mb-4">
                  Test your skills in our regular CTF competitions and
                  challenges designed to simulate real-world security scenarios.
                </p>
                <Link to="/challenge">
                  <h3
                    href="#"
                    className="text-[#01ffdb] flex items-center gap-2 group-hover:gap-3 transition-all"
                  >
                    Join contests <ArrowRight size={16} />
                  </h3>
                </Link>
              </motion.div>

              <motion.div
                className="bg-gradient-to-b from-black/10 via-gray-700/30 to-black/30 backdrop-blur-lg p-8 rounded-xl border-2 border-gray-700 hover:border-[#01ffdb]/30 transition-all group"
                variants={fadeIn}
                whileHover={{ y: -10 }}
              >
                <div className="bg-[#01ffdb]/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6 group-hover:bg-[#01ffdb]/20 transition-colors">
                  <Users className="text-[#01ffdb]" size={28} />
                </div>
                <h3 className="text-xl font-semibold mb-3">Community</h3>
                <p className="text-gray-300 mb-4">
                  Connect with like-minded individuals, share knowledge, and
                  collaborate on projects in our supportive community.
                </p>
                <Link to="/contest">
                  <h3
                    href="#"
                    className="text-[#01ffdb] flex items-center gap-2 group-hover:gap-3 transition-all"
                  >
                    Meet members <ArrowRight size={16} />
                  </h3>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-black/40 backdrop-blur-3xl border-gray-800">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
              >
                <h3 className="text-4xl font-bold text-[#01ffdb] mb-2">50+</h3>
                <p className="text-gray-300">Active Members</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                <h3 className="text-4xl font-bold text-[#01ffdb] mb-2">20+</h3>
                <p className="text-gray-300">Workshops</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <h3 className="text-4xl font-bold text-[#01ffdb] mb-2">10+</h3>
                <p className="text-gray-300">CTF Competitions</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <h3 className="text-4xl font-bold text-[#01ffdb] mb-2">5+</h3>
                <p className="text-gray-300">Partner Universities</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-transparent">
          <div className="container mx-auto px-6">
            <motion.div
              className="backdrop-blur-lg p-8 rounded-xl border-2 border-gray-700 hover:border-[#01ffdb]/30 transition-all group bg-transparent"
              variants={fadeIn}
              whileHover={{ y: -10 }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative z-10 max-w-3xl mx-auto md:mx-0 md:ml-[16.6667%]">
                <h2 className="text-3xl font-bold mb-6">
                  Ready to secure the digital frontier?
                </h2>
                <p className="text-gray-300 mb-8 text-lg">
                  Join CyberAnzen today and become part of a community dedicated
                  to cybersecurity excellence. Whether you're a beginner or an
                  expert, there's always more to learn and explore.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link to="/login">
                    <motion.button
                      className=" cyber-button  font-bold py-3 px-8 rounded-lg flex items-center gap-2 bg-[#01ffdb]/10 border border-[#01ffdb]/50 text-[#01ffdb]  hover:bg-[#01ffdb]/20"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Become a Member <ArrowRight size={18} />
                    </motion.button>
                  </Link>
                  <Link to="/about">
                    <motion.button
                      className="bg-transparent border border-white/20 text-white font-bold py-3 px-8 rounded-lg hover:bg-white/5 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      // onClick={() => {
                      //   // window.scrollTo({
                      //   //   top: document.body.scrollHeight,
                      //   //   behavior: "smooth",
                      //   // });
                      //   navigate("/about")
                      // }}
                    >
                      Contact Us
                    </motion.button>{" "}
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Upcoming Events Preview */}
        {/* <section className="py-16  bg-gradient-to-l from-gray-500/10  via-gray-700/30 backdrop-blur-lg  to-black/30">
          <div className="container mx-auto px-6">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-bold">Upcoming Events</h2>
              <a
                href="#"
                className="text-[#01ffdb] flex items-center gap-2 hover:underline"
              >
                View all <ArrowRight size={16} />
              </a>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <motion.div
                className="bg-gradient-to-b from-black/10 via-gray-700/30 to-black/30 backdrop-blur-lg rounded-xl overflow-hidden border border-gray-700 hover:border-[#01ffdb]/30 transition-all"
                whileHover={{ y: -5 }}
              >
                <div className="h-48 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80"
                    alt="Web Security Workshop"
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <div className="text-[#01ffdb] text-sm font-semibold mb-2">
                    May 15, 2025 • 2:00 PM
                  </div>
                  <h3 className="text-xl font-bold mb-2">
                    Web Security Workshop
                  </h3>
                  <p className="text-gray-300 mb-4">
                    Learn about common web vulnerabilities and how to protect
                    against them.
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/60">Virtual Event</span>
                    <button className="text-[#01ffdb] hover:underline">
                      Register
                    </button>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-gradient-to-b from-black/10 via-gray-700/30 to-black/30 backdrop-blur-lg rounded-xl overflow-hidden border border-gray-700 hover:border-[#01ffdb]/30 transition-all"
                whileHover={{ y: -5 }}
              >
                <div className="h-48 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80"
                    alt="Ethical Hacking Bootcamp"
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <div className="text-[#01ffdb] text-sm font-semibold mb-2">
                    June 5-7, 2025 • All Day
                  </div>
                  <h3 className="text-xl font-bold mb-2">
                    Ethical Hacking Bootcamp
                  </h3>
                  <p className="text-gray-300 mb-4">
                    Three-day intensive bootcamp covering ethical hacking
                    fundamentals.
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/60">Campus Center</span>
                    <button className="text-[#01ffdb] hover:underline">
                      Register
                    </button>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-gradient-to-b from-black/10 via-gray-700/30 to-black/30 backdrop-blur-lg rounded-xl overflow-hidden border border-gray-700 hover:border-[#01ffdb]/30 transition-all"
                whileHover={{ y: -5 }}
              >
                <div className="h-48 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1614064641938-3bbee52942c7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80"
                    alt="Summer CTF Competition"
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <div className="text-[#01ffdb] text-sm font-semibold mb-2">
                    July 20, 2025 • 10:00 AM
                  </div>
                  <h3 className="text-xl font-bold mb-2">
                    Summer CTF Competition
                  </h3>
                  <p className="text-gray-300 mb-4">
                    Test your skills in our biggest capture the flag event of
                    the year.
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/60">Online</span>
                    <button className="text-[#01ffdb] hover:underline">
                      Register
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section> */}
      </div>
    </div>
  );
}
