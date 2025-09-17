import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import {
  Github,
  Linkedin,
  Twitter,
  Instagram,
  Mail,
  Phone,
  ChevronUp,
} from "lucide-react";
import Logo from "./Logo";

const ACCENT = "#01ffdb";

export default function Footer() {
  const location = useLocation();
  const [showCyber, setShowCyber] = useState(true);
  const blacklistPatterns = [
    /^\/unauthorized\/?$/,
    /^\/challenge\/[a-f0-9]{24}\/?$/i,
    /^\/404\/?$/,
  ];
  const ismenuBlacklisted = blacklistPatterns.some((p) =>
    p.test(location.pathname)
  );

  useEffect(() => {
    const t = setTimeout(
      () => setShowCyber((s) => !s),
      showCyber ? 9000 : 4000
    );
    return () => clearTimeout(t);
  }, [showCyber]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  if (ismenuBlacklisted) return null;

  const socialLinks = [
    { name: "GitHub", icon: Github, url: "https://github.com/cyberanzen" },
    {
      name: "LinkedIn",
      icon: Linkedin,
      url: "https://linkedin.com/company/cyberanzen",
    },
    { name: "Twitter", icon: Twitter, url: "https://twitter.com/cyberanzen" },
    {
      name: "Instagram",
      icon: Instagram,
      url: "https://instagram.com/cyberanzen",
    },
  ];

  // motion variants for subtle floating/glitch layers
  const floatVariant = {
    animate: {
      x: [0, -2, 1, 0],
      y: [0, -1, 1, 0],
      opacity: [1, 0.9, 0.95, 1],
      transition: { duration: 2.6, repeat: Infinity, ease: "linear" },
    },
  };

  const floatVariant2 = {
    animate: {
      x: [0, 2, -1, 0],
      y: [0, 1, -1, 0],
      opacity: [0.9, 0.8, 0.85, 0.9],
      transition: { duration: 3.2, repeat: Infinity, ease: "linear" },
    },
  };

  return (
    <footer className="w-full left-0 z-50">
      <div className="w-full">
        {/* glass panel full-width, centered content */}
        <div className="w-full bg-gradient-to-b from-black/60 to-black/55 backdrop-blur-md backdrop-saturate-150 border border-[#01ffdb]/10 shadow-2xl">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* left */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center gap-3">
                  <Logo />
                  <div className="min-w-0">
                    <div className="relative text-sm sm:text-base font-semibold text-gray-100">
                      {/* three-layer glitch using framer-motion (no external css) */}
                      {/* <div className="relative block leading-none">
                        <motion.span
                          className="absolute left-0 top-0 text-[#01ffdb] mix-blend-screen pointer-events-none"
                          variants={floatVariant}
                          animate="animate"
                          aria-hidden
                        >
                          CyberAnzen
                        </motion.span>
                        <motion.span
                          className="absolute left-0 top-0 text-[#00fef0]/80 mix-blend-screen pointer-events-none"
                          variants={floatVariant2}
                          animate="animate"
                          aria-hidden
                        >
                          CyberAnzen
                        </motion.span>
                        <span className="relative text-gray-100">
                          CyberAnzen
                        </span>
                      </div> */}
                    </div>
                    {/* <div className="text-xs text-gray-300/70 truncate">
                      Student Cybersecurity Club
                    </div> */}
                  </div>
                </div>
              </div>

              {/* center - social icons */}
              <div className="flex items-center gap-3 justify-center">
                {/* <div className="flex gap-2 sm:gap-4">
                  {socialLinks.map((s) => (
                    <motion.a
                      key={s.name}
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      whileHover={{ y: -3 }}
                      className="p-2 rounded-md bg-black/20 backdrop-blur-sm border border-[#01ffdb]/10 flex items-center justify-center"
                      aria-label={s.name}
                    >
                      <s.icon className="w-4 h-4 text-gray-300 hover:text-[#01ffdb] transition-colors" />
                    </motion.a>
                  ))}
                </div> */}
              </div>

              {/* right - actions */}
              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={scrollToTop}
                  className="p-2 rounded-full bg-black/25 backdrop-blur-sm border border-[#01ffdb]/8 flex items-center justify-center"
                  aria-label="scroll to top"
                >
                  <ChevronUp size={16} className="text-[#01ffdb]" />
                </button>
                <div className="text-xs text-gray-300/70 text-right hidden sm:block">
                  <div>
                    Designed by <span className="text-[#01ffdb]">Vetrivel</span>
                     , <span className="text-[#01ffdb]">Jafrin Sam</span>{" "}
                    {/* <span className="text-[#01ffdb]">Sai Jhanav</span>,
                    <span className="text-[#01ffdb]">Yogesh</span> */}
                  </div>
                  <div className="text-[10px]">© 2025 CyberAnzen</div>
                </div>
              </div>
            </div>

            {/* second row - contact + newsletter */}
            <div className="mt-4 border-t flex justify-center border-[#ffffff]/10 pt-3">
              <div className="flex flex-col md:flex-row items-center md:justify-between gap-3">
                <div className="flex items-center gap-3 text-xs text-gray-300/70 flex-wrap">
                  <Mail className="w-4 h-4 text-[#01ffdb]" />
                  <a
                    href="mailto:cyberanzen.ctf@gmail.com"
                    className="hover:text-[#01ffdb] transition-colors"
                  >
                    cyberanzen.ctf@gmail.com
                  </a>
                  <span className="hidden md:inline">|</span>
                  <Phone className="w-4 h-4 text-[#01ffdb] hidden md:inline" />
                  <a
                    className="hidden md:inline hover:text-[#01ffdb] transition-colors"
                    href="tel:+91 6374294674"
                  >
                    +91 6374294674
                  </a>
                </div>

                {/* <div className="w-full md:w-1/2 lg:w-1/3">
                  <form className="flex items-center gap-2">
                    <input
                      type="email"
                      aria-label="email"
                      placeholder="Email"
                      className="w-full text-xs sm:text-sm px-3 py-2 rounded-md bg-black/20 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#01ffdb]"
                    />
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-3 py-2 rounded-md text-xs font-semibold border border-[#01ffdb]/30 bg-black/10"
                    >
                      Subscribe
                    </motion.button>
                  </form>
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export const MemoizedFooter = React.memo(Footer);
