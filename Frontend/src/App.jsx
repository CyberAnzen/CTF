import { useState, useEffect } from "react";
import Navbar from "./components/layout/navbar";
import "./App.css";
import "./index.css";
import Footer from "./components/layout/footer";
import Intro from "./components/intro";
import { AnimatePresence, motion } from "framer-motion";
// Import page components
import HomePage from "./routes/home";
import LearnPage from "./routes/learn";
import LoginPage from "./routes/login";
import AboutPage from "./routes/about";
import ForgetPassword from "./routes/forgetPassword";
import Terms from "./routes/terms";
import Signup from "./routes/signup";
import PrivacyPolicy from "./routes/privacyPolicy";
import Challenge from "./routes/Challenge";
import Unauthorized from "./routes/Unauthorised";
import { useAppContext } from "./context/AppContext";
// import useGetCsrfToken from "./hooks/utils/useGetCsrfToken";
import Testing from "./routes/testing";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import NotFound from "./routes/notFound";
import Profile from "./components/Profile/Profile";
import EditProfile from "./components/ProfilePage/EditProfile";
import Account from "./routes/account";
import ContentController from "./routes/ContentController";
import CertificateList from "./components/ProfilePage/CertificateList";
import AdminEditor from "./components/Admin/Content/adminEditor";
import Profilenew from "./components/ProfilePage/Profile";
import AddChallenges from "./routes/CTF/AddChallenges";
import DisplayChallenge from "./routes/CTF/DisplayChallenge";
import Leaderboard from "./routes/CTF/LeaderBoard";
import ScrollToTop from "./components/ScrollTop";
import Logout from "./routes/logout";

function App() {
  const { loggedIn } = useAppContext();
  // const getCsrfToken = useGetCsrfToken();
  const [intro, setIntro] = useState(true);
  const location = useLocation(); // Get the current route
  // Define routes where the footer should NOT appear
  const noFooterRoutes = ["/login", "/signup", "/forget-password", "/profile"];
  const navigate = useNavigate();
  // Check if the current route is NOT in the noFooterRoutes list
  const showFooter = !noFooterRoutes.includes(location.pathname);

  useEffect(() => {
    // Block scrolling while the intro is active
    document.body.style.overflow = "hidden";
    const timer = setTimeout(() => {
      setIntro(false);
      // Re-enable scrolling once the intro is done
      document.body.style.overflow = "";
    }, 3000);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = "";
    };
  }, []);

  // ✅ Google Analytics 4 pageview tracking
  useEffect(() => {
    if (window.gtag) {
      window.gtag("config", "G-LPPNYGH5J2", {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);

  return (
    <>
      <div className="relative w-full h-full min-h-screen overflow-hidden">
        {/*Background*/}

        {/* Live Background */}

        <Navbar />
        <div className="mb-30"></div>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/learn" element={<LearnPage />} />
          {/* <Route
            path="/lesson/:ClassificationId/:LessonId"
            element={<ContentController />}
          />
          <Route path="/lesson/create" element={<AdminEditor />} />
          <Route
            path="/lesson/update/:lessonId"
            element={<AdminEditor update />}
          /> */}
          <Route path="/challenge" element={<Challenge />} />
          <Route
            path="/challenge/:challengeId"
            element={<DisplayChallenge />}
          />
          <Route path="/challenge/add" element={<AddChallenges />} />
          <Route
            path="/challenge/edit/:challengeId"
            element={
              <AddChallenges
                onSuccess={(action) => {
                  alert(`Challenge ${action} successfully!`);
                  navigate("/challenges"); // Redirect to challenges list
                }}
              />
            }
          />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/signup" element={<Signup />} />
          {/* <Route path="/forget-password" element={<ForgetPassword />} /> */}
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/profile" element={<Profile />} />

          <Route path="/unauthorized" element={<Unauthorized />} />
          {/* <Route path="/test" element={<Testing />} /> */}
          <Route path="/404" element={<NotFound />} />

          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>

        {/* Animated line */}
        <motion.div
          className="w-full  h-0.5 bg-gradient-to-r from-transparent via-[#01ffdb]/30 to-transparent mt-0 "
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
        {/* Conditionally render the Footer */}
        {showFooter && <Footer />}
      </div>
      <AnimatePresence>
        {intro && (
          <motion.div
            initial={{ y: 0, opacity: 1 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 10000,
            }}
          >
            <Intro />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default App;
