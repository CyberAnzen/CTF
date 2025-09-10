import React, { useState, useEffect, useCallback, useRef } from "react";
import { User, Lock, Mail, Phone, CheckCircle, XCircle, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { debounce } from "lodash";
import ParticleBackground from "../components/Login/ParticleBackground";
import UserIcon from "../components/Login/UserIcon";
import "../index.css";
import Turnstile from "react-turnstile";
import { useAppContext } from "../context/AppContext";
import { ChevronDown } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Popup Modal Component
const PopupModal = ({ isOpen, onClose, type, title, message }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative bg-gray-900/95 border-2 border-[#01ffdb]/50 backdrop-blur-xl max-w-md w-full"
        style={{
          clipPath:
            "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))",
        }}
      >
        <div className="p-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#01ffdb]/70 hover:text-[#01ffdb] transition-colors"
          >
            <X size={20} />
          </button>

          {/* Icon and content */}
          <div className="flex items-start space-x-4">
            <div
              className={`flex-shrink-0 ${
                type === "success" ? "text-green-400" : "text-red-400"
              }`}
            >
              {type === "success" ? (
                <CheckCircle size={32} />
              ) : (
                <XCircle size={32} />
              )}
            </div>

            <div className="flex-1">
              <h3
                className={`font-mono font-bold text-lg mb-2 ${
                  type === "success" ? "text-green-400" : "text-red-400"
                }`}
              >
                {title}
              </h3>
              <p className="text-[#01ffdb]/80 font-mono text-sm leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 w-full bg-gray-700/50 h-1 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                type === "success" ? "bg-green-400" : "bg-red-400"
              } animate-pulse`}
              style={{
                animation: "shrink 5s linear forwards",
              }}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

export default function Signup() {
  const { loggedIn, setLoggedIn, User, fetchProfile } = useAppContext();

  const navigate = useNavigate();
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaVerified, setCaptchaVerified] = useState(false);

  // Popup states
  const [popup, setPopup] = useState({
    isOpen: false,
    type: "success", // 'success' or 'error'
    title: "",
    message: "",
  });

  useEffect(() => {
    if (loggedIn || User) {
      fetchProfile();
      navigate("/profile");
    }
  }, [loggedIn, User, navigate]);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    fullName: "",
    regNumber: "",
    dept: "",
    section: "",
    year: "",
    gender: "",
    mobile: "",
    officialEmail: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [usernameStatus, setUsernameStatus] = useState(null);
  const [passwordStatus, setPasswordStatus] = useState(null);
  const [confirmPasswordStatus, setConfirmPasswordStatus] = useState(null);
  const [officialEmailStatus, setOfficialEmailStatus] = useState(null);
  const [phoneStatus, setPhoneStatus] = useState(null);
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // New states for the "first click disable for 7 seconds" requirement
  const [submitDisabled, setSubmitDisabled] = useState(false);
  const [firstClickDone, setFirstClickDone] = useState(false);
  const submitTimerRef = useRef(null);

  useEffect(() => {
    // Smooth scroll to top
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });

    // Improved scroll handling for all devices
    const isMobile = window.innerWidth < 768;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (!isMobile) {
      // Only lock scroll on desktop/tablet
      document.body.style.overflow = "hidden";
      document.body.style.height = "100vh";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.documentElement.style.overflow = "hidden";
    }

    // Enhanced touch handling for all mobile devices
    const preventTouchMove = (e) => {
      // Allow scrolling within form containers
      const target = e.target;
      const scrollableParent = target.closest(
        ".overflow-y-auto, .overflow-auto"
      );
      if (!scrollableParent && !isMobile) {
        e.preventDefault();
      }
    };

    // Special handling for iOS to prevent bounce
    const preventIOSBounce = (e) => {
      if (isIOS) {
        const scrollY = window.pageYOffset;
        const maxScroll =
          document.documentElement.scrollHeight - window.innerHeight;
        if (scrollY <= 0 || scrollY >= maxScroll) {
          e.preventDefault();
        }
      }
    };

    document.addEventListener("touchmove", preventTouchMove, {
      passive: false,
    });
    if (isIOS) {
      document.addEventListener("touchmove", preventIOSBounce, {
        passive: false,
      });
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "";
      document.body.style.height = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.documentElement.style.overflow = "";
      document.removeEventListener("touchmove", preventTouchMove);
      if (isIOS) {
        document.removeEventListener("touchmove", preventIOSBounce);
      }
    };
  }, []);

  const debouncedCheckUsername = useCallback(
    debounce(async (username) => {
      try {
        const response = await axios.get(
          `${BACKEND_URL}/user/check-username?username=${username}`,
          {
            headers: {
              timestamp: Date.now(),
            },
          }
        );
        setUsernameStatus({
          type: response.data.available ? "success" : "error",
          message: response.data.available
            ? "Username is available"
            : "Username is already taken",
        });
      } catch (error) {
        setUsernameStatus({
          type: "error",
          message: "Error checking username",
        });
      }
    }, 500),
    []
  );

  useEffect(() => {
    if (touched.username) validateUsername(formData.username);
  }, [formData.username, touched.username]);

  useEffect(() => {
    if (touched.password) validatePassword(formData.password);
  }, [formData.password, touched.password]);

  useEffect(() => {
    if (touched.confirmPassword) {
      validateConfirmPassword(formData.password, formData.confirmPassword);
    }
  }, [formData.password, formData.confirmPassword, touched.confirmPassword]);

  useEffect(() => {
    if (touched.officialEmail) {
      validateOfficialEmail(formData.officialEmail);
    }
  }, [formData.officialEmail, touched.officialEmail]);

  useEffect(() => {
    if (touched.mobile) validateMobileStatus(formData.mobile);
  }, [formData.mobile, touched.mobile]);

  const SignupSubmit = async (data) => {
    setIsLoading(true);
    try {
      const numericData = {
        captcha: captchaToken,
        ...data,
        mobile: parseInt(data.mobile, 10) || 0,
        year: parseInt(data.year, 10) || 0,
      };
      const response = await axios.post(
        `${BACKEND_URL}/user/signup`,
        numericData,
        {
          headers: {
            timestamp: Date.now(),
          },
        }
      );

      // Show success popup
      setPopup({
        isOpen: true,
        type: "success",
        title: "ACCOUNT CREATED",
        message:
          "Your account has been successfully created! Redirecting to login page...",
      });

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      console.error("Error submitting form:", error);
      let errorMessage = "There was an error submitting the form.";
      if (error.response && error.response.data) {
        const errData = error.response.data;
        if (errData.error === "Duplicate") {
          errorMessage = `${errData.message}: ${errData.value}`;
        } else if (errData.error === "Validation failed") {
          errorMessage = errData.details.map((d) => d.message).join(", ");
        } else if (errData.error) {
          errorMessage = errData.error;
        } else if (errData.message) {
          errorMessage = errData.message;
        }
      }

      // Show error popup
      setPopup({
        isOpen: true,
        type: "error",
        title: "REGISTRATION FAILED",
        message: errorMessage,
      });

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const closePopup = () => {
    setPopup((prev) => ({ ...prev, isOpen: false }));
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (name === "username") {
      validateUsername(value);
    }
  };

  const validateUsername = (username) => {
    if (username.trim() === "") {
      setUsernameStatus(null);
      return;
    }
    if (username.length < 3) {
      setUsernameStatus({
        type: "error",
        message: "Username must be at least 3 characters",
      });
      return;
    }
    if (username.length > 15) {
      setUsernameStatus({
        type: "error",
        message: "Username must be less than 15 characters",
      });
      return;
    }
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      setUsernameStatus({
        type: "error",
        message: "Username can only contain letters and numbers",
      });
      return;
    }
    debouncedCheckUsername(username);
  };

  const validatePassword = (password) => {
    if (password.trim() === "") {
      setPasswordStatus(null);
      return;
    }
    if (password.length < 8) {
      setPasswordStatus({
        type: "error",
        message: "Password must be at least 8 characters",
      });
      return;
    }
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    if (hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar) {
      setPasswordStatus({ type: "success", message: "Password is strong" });
    } else {
      setPasswordStatus({
        type: "warning",
        message:
          "Password is weak (use uppercase, lowercase, numbers, and special characters)",
      });
    }
  };

  const validateConfirmPassword = (password, confirmPassword) => {
    if (confirmPassword.trim() === "") {
      setConfirmPasswordStatus(null);
      return;
    }
    if (password === confirmPassword) {
      setConfirmPasswordStatus({ type: "success", message: "Passwords match" });
    } else {
      setConfirmPasswordStatus({
        type: "error",
        message: "Passwords do not match",
      });
    }
  };

  const validateOfficialEmail = (email) => {
    if (email.trim() === "") {
      setOfficialEmailStatus(null);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(email)) {
      setOfficialEmailStatus({
        type: "success",
        message: "Valid email format",
      });
    } else {
      setOfficialEmailStatus({
        type: "error",
        message: "Invalid email format",
      });
    }
  };

  const validateMobileStatus = (mobile) => {
    if (mobile.trim() === "") {
      setPhoneStatus(null);
      return;
    }
    const indianMobileRegex = /^[6-9]\d{9}$/;
    if (indianMobileRegex.test(mobile)) {
      setPhoneStatus({ type: "success", message: "Valid mobile number" });
    } else {
      setPhoneStatus({ type: "error", message: "Invalid mobile number" });
    }
  };

  const validateMobile = (mobile) => {
    const indianMobileRegex = /^[6-9]\d{9}$/;
    if (!mobile) return "Mobile number is required";
    if (!indianMobileRegex.test(mobile)) {
      return "Please enter a valid 10-digit Indian mobile number";
    }
    return "";
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  };

  const validateRegNumber = (regNumber) => {
    if (!regNumber) return "Registration number is required";
    if (regNumber.length < 5) return "Registration number is too short";
    return "";
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username) newErrors.username = "Username is required";
    if (!formData.fullName) newErrors.fullName = "Full name is required";
    if (!formData.regNumber)
      newErrors.regNumber = "Registration number is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.officialEmail)
      newErrors.officialEmail = "Official email is required";
    if (!formData.dept) newErrors.dept = "Department is required";
    if (!formData.section) newErrors.section = "Section is required";
    if (!formData.year) newErrors.year = "Year is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.mobile) newErrors.mobile = "Mobile number is required";
    if (!formData.password) newErrors.password = "Password is required";
    if (!formData.confirmPassword)
      newErrors.confirmPassword = "Please confirm your password";
    if (!formData.terms)
      newErrors.terms = "You must accept the terms and conditions";

    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    const officialEmailError = validateEmail(formData.officialEmail);
    if (officialEmailError) newErrors.officialEmail = officialEmailError;

    const mobileError = validateMobile(formData.mobile);
    if (mobileError) newErrors.mobile = mobileError;

    const regNumberError = validateRegNumber(formData.regNumber);
    if (regNumberError) newErrors.regNumber = regNumberError;

    if (formData.password && formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Only trigger the "first-click 7s disable" once
    if (!firstClickDone) {
      setFirstClickDone(true);
      setSubmitDisabled(true);
      // Start 7 second timer
      submitTimerRef.current = setTimeout(() => {
        setSubmitDisabled(false);
      }, 7000);
    }

    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    if (validateForm()) {
      SignupSubmit(formData);
    } else {
      const firstError = document.querySelector('[data-error="true"]');
      if (firstError) {
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  // clear timer if component unmounts
  useEffect(() => {
    return () => {
      if (submitTimerRef.current) {
        clearTimeout(submitTimerRef.current);
      }
    };
  }, []);

  // Hide error after 5 seconds
  useEffect(() => {
    if (error) {
      const hideTimer = setTimeout(() => {
        setError("");
      }, 5000);
      return () => clearTimeout(hideTimer);
    }
  }, [error]);

  const isFormComplete = () => {
    const requiredFields = [
      "username",
      "email",
      "fullName",
      "regNumber",
      "dept",
      "section",
      "year",
      "gender",
      "mobile",
      "officialEmail",
      "password",
      "confirmPassword",
    ];
    for (let field of requiredFields) {
      if (!formData[field]) {
        return false;
      }
    }
    if (!formData.terms) {
      return false;
    }
    return true;
  };

  return (
    <div className="flex items-center justify-center px-2 sm:px-4 lg:px-6 relative overflow-hidden min-h-screen max-h-screen pt-4 sm:pt-6 lg:pt-10 pb-0">
      <ParticleBackground />

      {/* Popup Modal */}
      <PopupModal
        isOpen={popup.isOpen}
        onClose={closePopup}
        type={popup.type}
        title={popup.title}
        message={popup.message}
      />

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

      <div className="relative scroll -mt-32 z-10 w-full max-w-7xl pb-4 sm:pb-6 lg:pb-10">
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
            {/* Inner content area with proper scrolling */}
            <div
              className="bg-gray-900/50 max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] lg:max-h-[80vh] overflow-y-auto"
              style={{
                clipPath:
                  "polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 18px 100%, 0 calc(100% - 18px))",
                scrollbarWidth: "thin",
                scrollbarColor: "#01ffdb40 transparent",
              }}
            >
              {/* SIGN UP Header */}
              <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-20">
                <div
                  className="bg-[#01ffdb] text-black px-2 sm:px-4 py-1 font-mono font-bold text-sm sm:text-lg tracking-wider"
                  style={{
                    clipPath:
                      "polygon(0 0, calc(100% - 8px) 0, 100% 100%, 0 100%)",
                  }}
                >
                  SIGN UP
                </div>
              </div>

              {/* User Profile Scanner - Hidden on mobile */}
              <div className="hidden lg:block fixed top-20 xl:top-30 left-6 xl:left-10 z-50 flex-shrink-0">
                <div className="relative">
                  {/* Scanning frame */}
                  <div className="w-40 xl:w-48 h-40 xl:h-48 border-2 border-[#01ffdb]/70 relative bg-black/30 backdrop-blur-sm">
                    {/* Corner brackets */}
                    <div className="absolute top-0 left-0 w-6 xl:w-8 h-6 xl:h-8 border-t-4 border-l-4 border-[#01ffdb]" />
                    <div className="absolute top-0 right-0 w-6 xl:w-8 h-6 xl:h-8 border-t-4 border-r-4 border-[#01ffdb]" />
                    <div className="absolute bottom-0 left-0 w-6 xl:w-8 h-6 xl:h-8 border-b-4 border-l-4 border-[#01ffdb]" />
                    <div className="absolute bottom-0 right-0 w-6 xl:w-8 h-6 xl:h-8 border-b-4 border-r-4 border-[#01ffdb]" />

                    {/* User Icon */}
                    <div className="absolute inset-3 xl:inset-4 flex items-center justify-center">
                      <UserIcon size={120} className="xl:scale-110" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row items-start gap-4 sm:gap-6 lg:gap-12 xl:gap-16 mt-8 sm:mt-10 lg:mt-12 p-4 sm:p-6 lg:p-8 xl:p-12">
                {/* Left side spacer for desktop icon */}
                <div className="hidden lg:block flex-shrink-0 w-40 xl:w-48"></div>

                {/* Right side - Form */}
                <div className="flex-1 w-full">
                  <form
                    onSubmit={handleSubmit}
                    className="space-y-4 sm:space-y-6 lg:space-y-8"
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
                    {/* Personal Information Section */}
                    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                      <h3 className="text-[#01ffdb] font-mono text-sm sm:text-base lg:text-lg font-bold border-b border-[#01ffdb]/30 pb-2">
                        PERSONAL INFORMATION
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                        {/* Username */}
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
                                  name="username"
                                  value={formData.username}
                                  onChange={handleInputChange}
                                  onBlur={() => handleBlur("username")}
                                  placeholder="USERNAME"
                                  required
                                  data-error={
                                    validationErrors.username ? "true" : "false"
                                  }
                                  className="bg-transparent text-[#01ffdb] font-mono text-sm sm:text-base lg:text-lg placeholder:text-[#01ffdb]/60 outline-none flex-1"
                                />
                              </div>
                            </div>
                          </div>
                          {validationErrors.username && (
                            <p className="text-red-400 text-xs font-mono">
                              {validationErrors.username}
                            </p>
                          )}
                          {usernameStatus && (
                            <p
                              className={`text-xs font-mono ${
                                usernameStatus.type === "error"
                                  ? "text-red-400"
                                  : usernameStatus.type === "warning"
                                  ? "text-yellow-400"
                                  : "text-green-400"
                              }`}
                            >
                              {usernameStatus.message}
                            </p>
                          )}
                        </div>

                        {/* Full Name */}
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
                                  name="fullName"
                                  value={formData.fullName}
                                  onChange={handleInputChange}
                                  onBlur={() => handleBlur("fullName")}
                                  placeholder="FULL NAME"
                                  required
                                  data-error={
                                    validationErrors.fullName ? "true" : "false"
                                  }
                                  className="bg-transparent text-[#01ffdb] font-mono text-sm sm:text-base lg:text-lg placeholder:text-[#01ffdb]/60 outline-none flex-1"
                                />
                              </div>
                            </div>
                          </div>
                          {validationErrors.fullName && (
                            <p className="text-red-400 text-xs font-mono">
                              {validationErrors.fullName}
                            </p>
                          )}
                        </div>

                        {/* Email */}
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
                                  type="email"
                                  name="email"
                                  value={formData.email}
                                  onChange={handleInputChange}
                                  onBlur={() => handleBlur("email")}
                                  placeholder="EMAIL ADDRESS"
                                  required
                                  data-error={
                                    validationErrors.email ? "true" : "false"
                                  }
                                  className="bg-transparent text-[#01ffdb] font-mono text-sm sm:text-base lg:text-lg placeholder:text-[#01ffdb]/60 outline-none flex-1"
                                />
                              </div>
                            </div>
                          </div>
                          {validationErrors.email && (
                            <p className="text-red-400 text-xs font-mono">
                              {validationErrors.email}
                            </p>
                          )}
                        </div>

                        {/* Mobile Number */}
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
                                  type="number"
                                  name="mobile"
                                  value={formData.mobile}
                                  onChange={handleInputChange}
                                  onBlur={() => handleBlur("mobile")}
                                  placeholder="MOBILE NUMBER"
                                  required
                                  data-error={
                                    validationErrors.mobile ? "true" : "false"
                                  }
                                  className="bg-transparent text-[#01ffdb] font-mono text-sm sm:text-base lg:text-lg placeholder:text-[#01ffdb]/60 outline-none flex-1 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none appearance-none [-moz-appearance:textfield]"
                                />
                              </div>
                            </div>
                          </div>
                          {validationErrors.mobile && (
                            <p className="text-red-400 text-xs font-mono">
                              {validationErrors.mobile}
                            </p>
                          )}
                          {phoneStatus && (
                            <p
                              className={`text-xs font-mono ${
                                phoneStatus.type === "error"
                                  ? "text-red-400"
                                  : phoneStatus.type === "warning"
                                  ? "text-yellow-400"
                                  : "text-green-400"
                              }`}
                            >
                              {phoneStatus.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Academic Information Section */}
                    {/* import {ChevronDown} from "lucide-react"; */}
                    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                      <h3 className="text-[#01ffdb] font-mono text-sm sm:text-base lg:text-lg font-bold border-b border-[#01ffdb]/30 pb-2">
                        ACADEMIC INFORMATION
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                        {/* Registration Number */}
                        <div className="sm:col-span-2 space-y-2">
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
                                  name="regNumber"
                                  value={formData.regNumber}
                                  onChange={handleInputChange}
                                  onBlur={() => handleBlur("regNumber")}
                                  placeholder="REGISTRATION NUMBER"
                                  required
                                  data-error={
                                    validationErrors.regNumber
                                      ? "true"
                                      : "false"
                                  }
                                  className="bg-transparent text-[#01ffdb] font-mono text-sm sm:text-base lg:text-lg placeholder:text-[#01ffdb]/60 outline-none flex-1"
                                />
                              </div>
                            </div>
                          </div>
                          {validationErrors.regNumber && (
                            <p className="text-red-400 text-xs font-mono">
                              {validationErrors.regNumber}
                            </p>
                          )}
                        </div>

                        {/* Official Email */}
                        <div className="sm:col-span-2 space-y-2">
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
                                  type="email"
                                  name="officialEmail"
                                  value={formData.officialEmail}
                                  onChange={handleInputChange}
                                  onBlur={() => handleBlur("officialEmail")}
                                  placeholder="OFFICIAL EMAIL"
                                  required
                                  data-error={
                                    validationErrors.officialEmail
                                      ? "true"
                                      : "false"
                                  }
                                  className="bg-transparent text-[#01ffdb] font-mono text-sm sm:text-base lg:text-lg placeholder:text-[#01ffdb]/60 outline-none flex-1"
                                />
                              </div>
                            </div>
                          </div>
                          {validationErrors.officialEmail && (
                            <p className="text-red-400 text-xs font-mono">
                              {validationErrors.officialEmail}
                            </p>
                          )}
                          {officialEmailStatus && (
                            <p
                              className={`text-xs font-mono ${
                                officialEmailStatus.type === "error"
                                  ? "text-red-400"
                                  : officialEmailStatus.type === "warning"
                                  ? "text-yellow-400"
                                  : "text-green-400"
                              }`}
                            >
                              {officialEmailStatus.message}
                            </p>
                          )}
                        </div>

                        {/* Department */}
                        <div className="space-y-2">
                          <div className="relative">
                            <div
                              className="bg-[#01ffdb]/20 border border-[#01ffdb]/50 backdrop-blur-sm"
                              style={{
                                clipPath:
                                  "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
                              }}
                            >
                              <div className="flex items-center justify-between p-2 sm:p-3 relative">
                                <select
                                  name="dept"
                                  value={formData.dept}
                                  onChange={handleInputChange}
                                  onBlur={() => handleBlur("dept")}
                                  required
                                  data-error={
                                    validationErrors.dept ? "true" : "false"
                                  }
                                  className="bg-transparent text-[#01ffdb] font-mono text-sm sm:text-base lg:text-lg outline-none flex-1 appearance-none pr-6"
                                >
                                  <option
                                    value=""
                                    className="bg-gray-900 text-[#01ffdb]"
                                  >
                                    DEPARTMENT
                                  </option>
                                  <option
                                    value="CSE"
                                    className="bg-gray-900 text-[#01ffdb]"
                                  >
                                    CSE
                                  </option>
                                  <option
                                    value="ECE"
                                    className="bg-gray-900 text-[#01ffdb]"
                                  >
                                    ECE
                                  </option>
                                  <option
                                    value="EEE"
                                    className="bg-gray-900 text-[#01ffdb]"
                                  >
                                    EEE
                                  </option>
                                  <option
                                    value="MECH"
                                    className="bg-gray-900 text-[#01ffdb]"
                                  >
                                    MECH
                                  </option>
                                  <option
                                    value="CSE-CYBER"
                                    className="bg-gray-900 text-[#01ffdb]"
                                  >
                                    CSE Cyber
                                  </option>
                                  <option
                                    value="AIML"
                                    className="bg-gray-900 text-[#01ffdb]"
                                  >
                                    AIML
                                  </option>
                                  <option
                                    value="BIGDATA"
                                    className="bg-gray-900 text-[#01ffdb]"
                                  >
                                    Big Data
                                  </option>
                                </select>

                                {/* dropdown arrow icon */}
                                <ChevronDown
                                  size={18}
                                  className="absolute right-2 text-[#01ffdb] pointer-events-none"
                                />
                              </div>
                            </div>
                          </div>
                          {validationErrors.dept && (
                            <p className="text-red-400 text-xs font-mono">
                              {validationErrors.dept}
                            </p>
                          )}
                        </div>

                        {/* Section */}
                        <div className="space-y-2">
                          <div className="relative">
                            <div
                              className="bg-[#01ffdb]/20 border border-[#01ffdb]/50 backdrop-blur-sm"
                              style={{
                                clipPath:
                                  "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
                              }}
                            >
                              <div className="flex items-center justify-between p-2 sm:p-3 relative">
                                <select
                                  name="section"
                                  value={formData.section}
                                  onChange={handleInputChange}
                                  onBlur={() => handleBlur("section")}
                                  required
                                  data-error={
                                    validationErrors.section ? "true" : "false"
                                  }
                                  className="bg-transparent text-[#01ffdb] font-mono text-sm sm:text-base lg:text-lg outline-none flex-1 appearance-none pr-6"
                                >
                                  <option
                                    value=""
                                    className="bg-gray-900 text-[#01ffdb]"
                                  >
                                    SECTION
                                  </option>
                                  <option
                                    value="A"
                                    className="bg-gray-900 text-[#01ffdb]"
                                  >
                                    A
                                  </option>
                                  <option
                                    value="B"
                                    className="bg-gray-900 text-[#01ffdb]"
                                  >
                                    B
                                  </option>
                                  <option
                                    value="C"
                                    className="bg-gray-900 text-[#01ffdb]"
                                  >
                                    C
                                  </option>
                                  <option
                                    value="D"
                                    className="bg-gray-900 text-[#01ffdb]"
                                  >
                                    D
                                  </option>
                                  <option
                                    value="E"
                                    className="bg-gray-900 text-[#01ffdb]"
                                  >
                                    E
                                  </option>
                                  <option
                                    value="F"
                                    className="bg-gray-900 text-[#01ffdb]"
                                  >
                                    F
                                  </option>
                                  <option
                                    value="G"
                                    className="bg-gray-900 text-[#01ffdb]"
                                  >
                                    G
                                  </option>
                                </select>
                                <ChevronDown
                                  size={18}
                                  className="absolute right-2 text-[#01ffdb] pointer-events-none"
                                />
                              </div>
                            </div>
                          </div>
                          {validationErrors.section && (
                            <p className="text-red-400 text-xs font-mono">
                              {validationErrors.section}
                            </p>
                          )}
                        </div>

                        {/* Year */}
                        <div className="space-y-2">
                          <div className="relative">
                            <div
                              className="bg-[#01ffdb]/20 border border-[#01ffdb]/50 backdrop-blur-sm"
                              style={{
                                clipPath:
                                  "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
                              }}
                            >
                              <div className="flex items-center justify-between p-2 sm:p-3 relative">
                                <select
                                  name="year"
                                  value={formData.year}
                                  onChange={handleInputChange}
                                  onBlur={() => handleBlur("year")}
                                  required
                                  data-error={
                                    validationErrors.year ? "true" : "false"
                                  }
                                  className="bg-transparent text-[#01ffdb] font-mono text-sm sm:text-base lg:text-lg outline-none flex-1 appearance-none pr-6"
                                >
                                  <option
                                    value=""
                                    className="bg-gray-900 text-[#01ffdb]"
                                  >
                                    YEAR
                                  </option>
                                  <option
                                    value="1"
                                    className="bg-gray-900 text-[#01ffdb]"
                                  >
                                    1ST YEAR
                                  </option>
                                  <option
                                    value="2"
                                    className="bg-gray-900 text-[#01ffdb]"
                                  >
                                    2ND YEAR
                                  </option>
                                  <option
                                    value="3"
                                    className="bg-gray-900 text-[#01ffdb]"
                                  >
                                    3RD YEAR
                                  </option>
                                  <option
                                    value="4"
                                    className="bg-gray-900 text-[#01ffdb]"
                                  >
                                    4TH YEAR
                                  </option>
                                </select>
                                <ChevronDown
                                  size={18}
                                  className="absolute right-2 text-[#01ffdb] pointer-events-none"
                                />
                              </div>
                            </div>
                          </div>
                          {validationErrors.year && (
                            <p className="text-red-400 text-xs font-mono">
                              {validationErrors.year}
                            </p>
                          )}
                        </div>

                        {/* Gender */}
                        <div className="space-y-2">
                          <div className="relative">
                            <div
                              className="bg-[#01ffdb]/20 border border-[#01ffdb]/50 backdrop-blur-sm"
                              style={{
                                clipPath:
                                  "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
                              }}
                            >
                              <div className="flex items-center justify-between p-2 sm:p-3 relative">
                                <select
                                  name="gender"
                                  value={formData.gender}
                                  onChange={handleInputChange}
                                  onBlur={() => handleBlur("gender")}
                                  required
                                  data-error={
                                    validationErrors.gender ? "true" : "false"
                                  }
                                  className="bg-transparent text-[#01ffdb] font-mono text-sm sm:text-base lg:text-lg outline-none flex-1 appearance-none pr-6"
                                >
                                  <option
                                    value=""
                                    className="bg-gray-900 text-[#01ffdb]"
                                  >
                                    GENDER
                                  </option>
                                  <option
                                    value="Male"
                                    className="bg-gray-900 text-[#01ffdb]"
                                  >
                                    MALE
                                  </option>
                                  <option
                                    value="Female"
                                    className="bg-gray-900 text-[#01ffdb]"
                                  >
                                    FEMALE
                                  </option>
                                  <option
                                    value="Other"
                                    className="bg-gray-900 text-[#01ffdb]"
                                  >
                                    OTHER
                                  </option>
                                </select>
                                <ChevronDown
                                  size={18}
                                  className="absolute right-2 text-[#01ffdb] pointer-events-none"
                                />
                              </div>
                            </div>
                          </div>
                          {validationErrors.gender && (
                            <p className="text-red-400 text-xs font-mono">
                              {validationErrors.gender}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Security Section */}
                    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                      <h3 className="text-[#01ffdb] font-mono text-sm sm:text-base lg:text-lg font-bold border-b border-[#01ffdb]/30 pb-2">
                        PASSWORD
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                        {/* Password */}
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
                                  name="password"
                                  value={formData.password}
                                  onChange={handleInputChange}
                                  onBlur={() => handleBlur("password")}
                                  placeholder="••••••••••••••••"
                                  required
                                  data-error={
                                    validationErrors.password ? "true" : "false"
                                  }
                                  className="bg-transparent text-[#01ffdb] font-mono text-sm sm:text-base lg:text-lg placeholder:text-[#01ffdb]/60 outline-none flex-1"
                                />
                              </div>
                            </div>
                          </div>
                          {validationErrors.password && (
                            <p className="text-red-400 text-xs font-mono">
                              {validationErrors.password}
                            </p>
                          )}
                          {passwordStatus && (
                            <p
                              className={`text-xs font-mono ${
                                passwordStatus.type === "error"
                                  ? "text-red-400"
                                  : passwordStatus.type === "warning"
                                  ? "text-yellow-400"
                                  : "text-green-400"
                              }`}
                            >
                              {passwordStatus.message}
                            </p>
                          )}
                        </div>

                        {/* Confirm Password */}
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
                                  name="confirmPassword"
                                  value={formData.confirmPassword}
                                  onChange={handleInputChange}
                                  onBlur={() => handleBlur("confirmPassword")}
                                  placeholder="••••••••••••••••"
                                  required
                                  data-error={
                                    validationErrors.confirmPassword
                                      ? "true"
                                      : "false"
                                  }
                                  className="bg-transparent text-[#01ffdb] font-mono text-sm sm:text-base lg:text-lg placeholder:text-[#01ffdb]/60 outline-none flex-1"
                                />
                              </div>
                            </div>
                          </div>
                          {validationErrors.confirmPassword && (
                            <p className="text-red-400 text-xs font-mono">
                              {validationErrors.confirmPassword}
                            </p>
                          )}
                          {confirmPasswordStatus && (
                            <p
                              className={`text-xs font-mono ${
                                confirmPasswordStatus.type === "error"
                                  ? "text-red-400"
                                  : confirmPasswordStatus.type === "warning"
                                  ? "text-yellow-400"
                                  : "text-green-400"
                              }`}
                            >
                              {confirmPasswordStatus.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Terms and Submit */}
                    <div className="space-y-4 sm:space-y-6">
                      {/* Terms */}
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          name="terms"
                          id="terms"
                          checked={formData.terms}
                          onChange={handleInputChange}
                          onBlur={() => handleBlur("terms")}
                          className="w-4 h-4 mt-1 bg-transparent border-2 border-[#01ffdb]/50 rounded-none 
                                   checked:bg-[#01ffdb] checked:border-[#01ffdb] 
                                   focus:ring-[#01ffdb]/50 focus:ring-2 flex-shrink-0"
                        />
                        <label
                          htmlFor="terms"
                          className="text-[#01ffdb]/70 font-mono text-xs sm:text-sm leading-relaxed"
                        >
                          ACCEPT<Link to={"/terms"}> TERMS AND CONDITIONS</Link>
                        </label>
                        {validationErrors.terms && (
                          <p className="text-red-400 text-xs font-mono ml-2">
                            {validationErrors.terms}
                          </p>
                        )}
                      </div>

                      {/* Captcha Cloudflare */}
                      <div className="flex justify-center mb-4">
                        <div className="w-full max-w-sm">
                          <Turnstile
                            sitekey={import.meta.env.VITE_CF_SITE_KEY}
                            onVerify={(token) => {
                              setCaptchaToken(token);
                              setCaptchaVerified(true);
                            }}
                            onExpire={() => {
                              setCaptchaToken("");
                              setCaptchaVerified(false);
                            }}
                            theme="dark"
                            size="flexible"
                          />
                        </div>
                      </div>

                      {/* Submit Button - hidden until form complete and captcha verified */}
                      <div
                        className={`transition-all duration-700 ease-out transform ${
                          isFormComplete() && captchaVerified
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 -translate-y-6 pointer-events-none"
                        }`}
                        style={{ willChange: "opacity, transform" }}
                      >
                        <button
                          type="submit"
                          disabled={
                            !isFormComplete() ||
                            !captchaVerified ||
                            isLoading ||
                            submitDisabled
                          }
                          className="cyber-button w-full py-2 sm:py-3 px-4 sm:px-6 bg-[#01ffdb]/10 border-2 border-[#01ffdb]/50
             text-[#01ffdb] font-mono text-sm sm:text-base lg:text-lg font-bold
             hover:bg-[#01ffdb]/20 hover:border-[#01ffdb]
             transition-all duration-300 relative overflow-hidden
             disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            clipPath:
                              "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
                          }}
                        >
                          <div className="relative z-10">
                            {isLoading ? "PROCESSING..." : "CREATE ACCOUNT"}
                          </div>

                          {/* Animated background effect */}
                          <div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-[#01ffdb]/10 to-transparent 
                  transform -skew-x-12 -translate-x-full animate-pulse"
                          />
                        </button>
                      </div>

                      {/* Login link */}
                      <div className="text-center text-[#01ffdb]/70 font-mono text-xs sm:text-sm">
                        ALREADY REGISTERED?{" "}
                        <Link to="/login">
                          <span className="text-[#01ffdb] hover:text-[#01ffdb]/80 transition-colors font-bold">
                            LOGIN HERE
                          </span>
                        </Link>
                      </div>
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

      {/* Additional cyberpunk elements - Hidden on mobile */}
      {/* <div className="hidden lg:block absolute top-10 right-10 text-[#01ffdb]/30 font-mono text-xs">
        <div>SYS_STATUS: ONLINE</div>
        <div>REG_MODE: ACTIVE</div>
        <div>CONN_STATE: SECURE</div>
      </div>

      <div className="hidden lg:block absolute bottom-10 left-10 text-[#01ffdb]/30 font-mono text-xs">
        <div>PROTOCOL: HTTPS/2.0</div>
        <div>ENCRYPTION: AES-256</div>
        <div>NODE: REGISTRATION</div>
      </div> */}
    </div>
  );
}

export { Signup };
