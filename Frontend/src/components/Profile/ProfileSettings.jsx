import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import { useAppContext } from "../../context/AppContext";
import Usefetch from "../../hooks/Usefetch";
import { AlertTriangle, Users, HelpCircle } from "lucide-react";
import axios from "axios";

export default function ProfileSettings() {
  const { user, fetchProfile } = useAppContext();
  console.log(user);

  const [formData, setFormData] = useState({
    fullName: user?.userDetails?.name || "",
    regNumber: user?.regNumber || "",
    section: user?.userDetails?.section || "",
    email: user?.email || "",
    year: user?.userDetails?.year || "",
    dept: user?.userDetails?.dept || "",
    officialEmail: user?.officialEmail || "",
    gender: user?.userDetails?.gender || "",
    userName: user?.userDetails?.userName || "", // <-- new field
  });

  // refs to hold the initial snapshot so we can compare for changes
  const initialFormRef = useRef(null);
  const initialImageRef = useRef(
    "https://i.pinimg.com/736x/af/70/bb/af70bb880077591b711b83ee7717c91b.jpg"
  );

  useEffect(() => {
    const initial = {
      fullName: user?.userDetails?.name || "",
      regNumber: user?.regNumber || "",
      section: user?.userDetails?.section || "",
      email: user?.email || "",
      year: user?.userDetails?.year || "",
      dept: user?.userDetails?.dept || "",
      officialEmail: user?.officialEmail || "",
      gender: user?.userDetails?.gender || "",
      userName: user?.username || "",
    };
    setFormData(initial);

    // store initial snapshot for change detection
    initialFormRef.current = initial;

    // capture initial image too (if you want the avatar included in change detection)
    initialImageRef.current =
      "https://i.pinimg.com/736x/af/70/bb/af70bb880077591b711b83ee7717c91b.jpg";
  }, [user]);

  const [image, setImage] = useState(initialImageRef.current);
  const [password, setPassword] = useState({ current: "", next: "" });
  const [validationErrors, setValidationErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState("");
  const [yearOpen, setYearOpen] = useState(false);
  const [sectionOpen, setSectionOpen] = useState(false);
  const [genderOpen, setGenderOpen] = useState(false);

  // username status for availability checks
  const [usernameStatus, setUsernameStatus] = useState(null); // {type: 'success'|'error', message: ''}

  const fileInputRef = useRef();
  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
    }
  };

  // Usefetch for updating profile (auto=false so we call retry manually)
  const {
    Data: updateResponse,
    error: fetchError,
    loading: updateLoading,
    retry: postRetry,
  } = Usefetch("profile/update", "post", null, {}, false);

  // Keep a stable ref to postRetry so effects / handlers don't re-run if identity changes
  const postRetryRef = useRef(postRetry);
  useEffect(() => {
    postRetryRef.current = postRetry;
  }, [postRetry]);

  // avoid updating state after unmount
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // helper to POST update via the hook
  const SignupSubmit = async (data) => {
    // prevent double submits
    if (isLoading || updateLoading) return;

    setIsLoading(true);
    setLocalError("");
    setUpdateStatus(null);

    // Build payload: include username if present
    const Payload = {
      fullName: data.fullName,
      section: data.section,
      dept: data.dept,
      gender: data.gender,
      email: data.email,
      regNumber: data.regNumber,
      year: data.year,
      userName: data.userName,
    };

    try {
      // Use the retry function returned from Usefetch. It accepts (retryState, options)
      // call the stable ref so we don't rely on changing identity in the closure
      const retryFn = postRetryRef.current || postRetry;
      if (!retryFn) {
        // If hook didn't return a retry fn for some reason, fallback to axios as last resort
        await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/profile/update`,
          Payload,
          { withCredentials: true }
        );
      } else {
        await retryFn({}, { data: Payload });
      }
      // the hook should set updateResponse; we observe it in an effect below
    } catch (err) {
      if (!isMountedRef.current) return;
      setLocalError("Failed to update profile. Try again.");
      setIsLoading(false);
    }
  };

  // watch hook result and show feedback
  const [updateStatus, setUpdateStatus] = useState(null); // { type: 'success'|'error', message }

  useEffect(() => {
    if (!isMountedRef.current) return;
    if (updateResponse) {
      // If backend reply structure is like { success: true, message: '', data: {...} }
      const msg =
        updateResponse?.message ||
        updateResponse?.data?.message ||
        "Profile updated successfully";
      setUpdateStatus({ type: "success", message: msg });
      setIsLoading(false);
      // Refresh the profile from server (so UI shows latest user info)
      if (fetchProfile) fetchProfile();

      // reset initial snapshot so hasChanges becomes false after a successful update
      initialFormRef.current = {
        fullName: formData.fullName,
        regNumber: formData.regNumber,
        section: formData.section,
        email: formData.email,
        year: formData.year,
        dept: formData.dept,
        officialEmail: formData.officialEmail,
        gender: formData.gender,
        userName: formData.userName,
      };
      initialImageRef.current = image;

      // clear usernameStatus after success (so it's not stuck)
      setUsernameStatus(null);

      // auto-dismiss success message after 4s
      const t = setTimeout(() => {
        if (!isMountedRef.current) return;
        setUpdateStatus(null);
      }, 4000);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateResponse]);

  useEffect(() => {
    if (!isMountedRef.current) return;
    if (fetchError) {
      // fetchError may be an object; try to read message gracefully
      const message =
        (fetchError && fetchError.message) ||
        (typeof fetchError === "string" ? fetchError : "Update failed");
      setUpdateStatus({
        type: "error",
        message,
      });
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchError]);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPassword((prev) => ({ ...prev, [name]: value }));

    // validate new password as user types
    if (name === "next") {
      const err = validatePassword(value);
      setValidationErrors((prev) => ({ ...prev, password: err }));
    } else if (name === "current") {
      // optional: clear current password error if present
      if (validationErrors.currentPassword) {
        setValidationErrors((prev) => ({ ...prev, currentPassword: "" }));
      }
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    // run field-specific validation on blur
    switch (field) {
      case "email": {
        const err = validateEmail(formData.email);
        setValidationErrors((prev) => ({ ...prev, email: err }));
        break;
      }
      case "regNumber": {
        const err = validateRegNumber(formData.regNumber);
        setValidationErrors((prev) => ({ ...prev, regNumber: err }));
        break;
      }
      case "fullName": {
        const err = validateFullName(formData.fullName);
        setValidationErrors((prev) => ({ ...prev, fullName: err }));
        break;
      }
      case "dept": {
        const err = validateDept(formData.dept);
        setValidationErrors((prev) => ({ ...prev, dept: err }));
        break;
      }
      case "section": {
        const err = formData.section ? "" : "Section is required";
        setValidationErrors((prev) => ({ ...prev, section: err }));
        break;
      }
      case "year": {
        const err =
          formData.year && [1, 2, 3, 4].includes(Number(formData.year))
            ? ""
            : "Year is required";
        setValidationErrors((prev) => ({ ...prev, year: err }));
        break;
      }
      case "gender": {
        const err = formData.gender ? "" : "Gender is required";
        setValidationErrors((prev) => ({ ...prev, gender: err }));
        break;
      }
      case "userName": {
        // run basic validation on blur too
        validateUsername(formData.userName);
        break;
      }
      default:
        break;
    }
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

    // If username changed, trigger validation (debounced check)
    if (name === "userName") {
      validateUsername(value);
    }
  };

  // ---------- Validators ----------
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  };

  const validateRegNumber = (regNumber) => {
    if (!regNumber) return "Registration number is required";
    if (typeof regNumber === "string" && regNumber.trim().length < 5)
      return "Registration number is too short";
    if (!/^[A-Za-z0-9\-_.]+$/.test(regNumber))
      return "Registration number contains invalid characters";
    return "";
  };

  const validateFullName = (name) => {
    if (!name) return "Full name is required";
    if (!/^[a-zA-Z ]{3,50}$/.test(name))
      return "Full name must be 3–50 letters (letters and spaces only)";
    return "";
  };

  const validateDept = (dept) => {
    if (!dept) return "Department is required";
    if (dept.trim().length < 2) return "Department name is too short";
    return "";
  };

  const validatePassword = (pwd) => {
    if (!pwd) return "Password is required";
    if (pwd.length < 8 || pwd.length > 12)
      return "Password must be 8–12 characters";
    if (!/[a-z]/.test(pwd))
      return "Password must include at least one lowercase";
    if (!/[A-Z]/.test(pwd))
      return "Password must include at least one uppercase";
    return "";
  };

  // ---------- Form-level validation ----------
  const validateForm = () => {
    const newErrors = {};
    const fullNameErr = validateFullName(formData.fullName);
    if (fullNameErr) newErrors.fullName = fullNameErr;

    const regErr = validateRegNumber(formData.regNumber);
    if (regErr) newErrors.regNumber = regErr;

    const emailErr = validateEmail(formData.email);
    if (emailErr) newErrors.email = emailErr;

    const deptErr = validateDept(formData.dept);
    if (deptErr) newErrors.dept = deptErr;

    if (!formData.section) newErrors.section = "Section is required";
    if (!formData.year) newErrors.year = "Year is required";
    if (!formData.gender) newErrors.gender = "Gender is required";

    // username status check (if user changed username)
    if (formData.userName && usernameStatus?.type === "error") {
      newErrors.userName = usernameStatus.message || "Username not available";
    }

    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
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

  const isFormComplete = () => {
    const requiredFields = [
      "email",
      "fullName",
      "regNumber",
      "dept",
      "section",
      "year",
      "gender",
    ];
    for (let field of requiredFields) {
      if (!formData[field]) {
        return false;
      }
    }
    return true;
  };

  // helper for shallow stable compare on form fields
  const isFormEqual = (a = {}, b = {}) => {
    const keys = [
      "fullName",
      "regNumber",
      "section",
      "email",
      "year",
      "dept",
      "officialEmail",
      "gender",
      "userName",
    ];
    return keys.every((k) => (a[k] || "") === (b[k] || ""));
  };

  // hasChanges: true if form differs from initial snapshot OR image changed OR password fields touched
  const hasChanges = useMemo(() => {
    // if we haven't captured initial snapshot yet, consider no changes
    if (!initialFormRef.current) return false;

    const formChanged = !isFormEqual(initialFormRef.current, formData);
    const imageChanged =
      String(image || "") !== String(initialImageRef.current || "");
    const passwordChanged = Boolean(password.current || password.next);

    return formChanged || imageChanged || passwordChanged;
  }, [formData, image, password]);

  const inputStyle =
    "w-full px-4 py-0 rounded-lg inset-0 h-10 rounded-full bg-gradient-to-r from-[#00bfff]/15 via-[#1e90ff]/10 to-[#00bfff]/5 border border-[#00bfff]/30 transition-all duration-300 text-white placeholder-[#00bfff]/30 outline-none focus:outline-none focus:ring-1 focus:ring-[#00bfff]";

  // ---------------- Username availability check (debounced + cancellable) ----------------
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const debounceTimerRef = useRef(null);
  const usernameAbortRef = useRef(null);

  const debouncedCheckUsername = useCallback(
    (username) => {
      // clear previous timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      // cancel previous inflight username request
      if (usernameAbortRef.current) {
        try {
          usernameAbortRef.current.abort();
        } catch (e) {
          // noop
        }
        usernameAbortRef.current = null;
      }

      // don't check empty usernames
      if (!username || username.trim() === "") {
        setUsernameStatus(null);
        return;
      }

      // If username equals initial value, consider it available (no request)
      if (
        initialFormRef.current &&
        initialFormRef.current.userName &&
        initialFormRef.current.userName === username
      ) {
        setUsernameStatus({ type: "success", message: "Current username" });
        return;
      }

      debounceTimerRef.current = setTimeout(async () => {
        // create an AbortController so we can cancel if user keeps typing
        const controller = new AbortController();
        usernameAbortRef.current = controller;

        try {
          const response = await axios.get(
            `${BACKEND_URL}/user/check-username?username=${encodeURIComponent(
              username
            )}`,
            {
              headers: {
                timestamp: Date.now(),
              },
              withCredentials: true,
              signal: controller.signal,
            }
          );

          if (!isMountedRef.current) return;
          setUsernameStatus({
            type: response.data?.available ? "success" : "error",
            message: response.data?.available
              ? "Username is available"
              : "Username is already taken",
          });
        } catch (error) {
          if (!isMountedRef.current) return;
          if (axios.isCancel && axios.isCancel(error)) {
            // request cancelled — ignore
            return;
          }
          // if aborted via AbortController signal, axios may throw DOMException; ignore
          if (error?.name === "CanceledError" || error?.name === "AbortError")
            return;

          setUsernameStatus({
            type: "error",
            message: "Error checking username",
          });
        } finally {
          usernameAbortRef.current = null;
        }
      }, 500);
    },
    [BACKEND_URL]
  );

  const validateUsername = (username) => {
    if (!username || username.trim() === "") {
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
    // async availability check
    debouncedCheckUsername(username);
  };

  // cleanup debounce and inflight username request on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (usernameAbortRef.current) {
        try {
          usernameAbortRef.current.abort();
        } catch (e) {
          // noop
        }
        usernameAbortRef.current = null;
      }
    };
  }, []);

  // ----------------- render -----------------
  return (
    <div className="px-0 min-h-screen font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side (Main Info) */}
        <div className="lg:col-span-2 space-y-6">
          {/* formData Information */}
          <form
            onSubmit={handleSubmit}
            className="bg-black/50 rounded-xl border text-[#00ffff]/25 p-6 space-y-4 shadow-sm"
          >
            <h2 className="text-lg text-[#00ffff] font-semibold">
              General Information
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="email"
                name="officialEmail"
                placeholder="Official Email"
                value={formData.officialEmail}
                className={`${inputStyle} opacity-50`}
                disabled
              />
              <div>
                <input
                  type="text"
                  name="regNumber"
                  placeholder="Registration Number"
                  value={formData.regNumber}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur("regNumber")}
                  data-error={!!validationErrors.regNumber}
                  className={inputStyle}
                />
                {validationErrors.regNumber && (
                  <p className="text-red-400 text-xs mt-1">
                    {validationErrors.regNumber}
                  </p>
                )}
              </div>

              <div>
                <input
                  type="text"
                  name="fullName"
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur("fullName")}
                  data-error={!!validationErrors.fullName}
                  className={inputStyle}
                />
                {validationErrors.fullName && (
                  <p className="text-red-400 text-xs mt-1">
                    {validationErrors.fullName}
                  </p>
                )}
              </div>

              <div>
                <input
                  type="text"
                  name="email"
                  placeholder="Personal Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur("email")}
                  data-error={!!validationErrors.email}
                  className={inputStyle}
                />
                {validationErrors.email && (
                  <p className="text-red-400 text-xs mt-1">
                    {validationErrors.email}
                  </p>
                )}
              </div>

              {/* Username field */}
              <div>
                <input
                  type="text"
                  name="userName"
                  placeholder="Username (3–15 chars, letters/numbers)"
                  value={formData.userName}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur("userName")}
                  data-error={
                    !!validationErrors.userName ||
                    usernameStatus?.type === "error"
                  }
                  className={inputStyle}
                />
                {usernameStatus && (
                  <p
                    className={`text-xs mt-1 ${
                      usernameStatus.type === "success"
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {usernameStatus.message}
                  </p>
                )}
                {validationErrors.userName && (
                  <p className="text-red-400 text-xs mt-1">
                    {validationErrors.userName}
                  </p>
                )}
              </div>

              <div className="relative" data-error={!!validationErrors.gender}>
                <button
                  type="button"
                  onClick={() => setGenderOpen(!genderOpen)}
                  className={`${inputStyle} text-left cursor-pointer`}
                >
                  {formData.gender || "Select Gender"}
                </button>

                {genderOpen && (
                  <>
                    <ul className="absolute z-30 w-full mt-1 bg-[#17181A] border border-[#00ffff] rounded-md shadow-lg">
                      {["Male", "Female", "Other"].map((gender) => (
                        <li
                          key={gender}
                          onClick={() => {
                            handleInputChange({
                              target: { name: "gender", value: gender },
                            });
                            setGenderOpen(false);
                          }}
                          className="px-3 py-2 cursor-pointer hover:bg-[#00ffff] hover:text-black"
                        >
                          {gender}
                        </li>
                      ))}
                    </ul>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setGenderOpen(false)}
                    />
                  </>
                )}
              </div>

              <div className="relative" data-error={!!validationErrors.section}>
                <button
                  type="button"
                  onClick={() => setSectionOpen(!sectionOpen)}
                  className={`${inputStyle} text-left cursor-pointer`}
                >
                  {formData.section || "Select Section"}
                </button>

                {sectionOpen && (
                  <>
                    <ul className="absolute z-30 w-full mt-1 bg-[#17181A] border border-[#00ffff] rounded-md shadow-lg">
                      {["A", "B", "C", "D", "E", "F", "G", "No Section"].map(
                        (section) => (
                          <li
                            key={section}
                            onClick={() => {
                              handleInputChange({
                                target: { name: "section", value: section },
                              });
                              setSectionOpen(false);
                            }}
                            className="px-3 py-2 cursor-pointer hover:bg-[#00ffff] hover:text-black"
                          >
                            {section}
                          </li>
                        )
                      )}
                    </ul>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setSectionOpen(false)}
                    />
                  </>
                )}
              </div>

              <div className="relative" data-error={!!validationErrors.year}>
                <button
                  type="button"
                  onClick={() => setYearOpen(!yearOpen)}
                  className={`${inputStyle} text-left cursor-pointer`}
                >
                  {
                    // Find the label based on numeric value, default to "Select Year"
                    [
                      { label: "First Year", value: 1 },
                      { label: "Second Year", value: 2 },
                      { label: "Third Year", value: 3 },
                      { label: "Fourth Year", value: 4 },
                    ].find((y) => y.value === formData.year)?.label ||
                      "Select Year"
                  }
                </button>

                {yearOpen && (
                  <>
                    <ul className="absolute z-30 w-full mt-1 bg-[#17181A] border border-[#00ffff] rounded-md shadow-lg">
                      {[
                        { label: "First Year", value: 1 },
                        { label: "Second Year", value: 2 },
                        { label: "Third Year", value: 3 },
                        { label: "Fourth Year", value: 4 },
                      ].map((year) => (
                        <li
                          key={year.value}
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              year: year.value, // numeric value sent to backend
                            }));
                            setYearOpen(false);
                          }}
                          className="px-3 py-2 cursor-pointer hover:bg-[#00ffff] hover:text-black"
                        >
                          {year.label}
                        </li>
                      ))}
                    </ul>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setYearOpen(false)}
                    />
                  </>
                )}
              </div>

              <div>
                <input
                  type="text"
                  name="dept"
                  placeholder="Department"
                  value={formData.dept}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur("dept")}
                  data-error={!!validationErrors.dept}
                  className={inputStyle}
                />
                {validationErrors.dept && (
                  <p className="text-red-400 text-xs mt-1">
                    {validationErrors.dept}
                  </p>
                )}
              </div>
            </div>

            <div className="text-right space-x-2">
              <button
                type="submit"
                className="px-6 py-2 rounded-lg
               bg-[#01ffdb]/20 
               text-[#01ffdb] font-medium
               border border-[#01ffdb]/40
               backdrop-blur-md
               shadow-lg shadow-[#01ffdb]/10
               hover:bg-[#01ffdb]/30
               hover:border-[#01ffdb]/60
               hover:shadow-[#01ffdb]/30
               transition-all duration-300
               disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={
                  !isFormComplete() || isLoading || updateLoading || !hasChanges
                }
              >
                {isLoading || updateLoading ? "Updating..." : "Update"}
              </button>
            </div>

            {/* updated status */}
            {updateStatus && (
              <div
                className={`mt-3 text-sm ${
                  updateStatus.type === "success"
                    ? "text-green-300"
                    : "text-red-300"
                }`}
              >
                {updateStatus.message}
              </div>
            )}
            {localError && (
              <div className="mt-3 text-sm text-red-300">{localError}</div>
            )}
          </form>

          {/* Password Info */}
          {/* <div className="bg-black/50 rounded-xl border text-[#00ffff]/25 p-6 space-y-4 shadow-sm blur-xs">
            <h2 className="text-lg text-[#00ffff] font-semibold">
              Password Information
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="password"
                name="current"
                placeholder="Current Password"
                value={password.current}
                onChange={handlePasswordChange}
                className={inputStyle}
              />
              <input
                type="password"
                name="next"
                placeholder="New Password"
                value={password.next}
                onChange={handlePasswordChange}
                className={inputStyle}
              />
            </div>
            {validationErrors.password && (
              <p className="text-red-400 text-xs mt-1">
                {validationErrors.password}
              </p>
            )}
            <ul className="text-sm text-[#00ffff]/30 list-disc pl-5">
              <li>At least 8 characters and up to 12 characters</li>
              <li>At least one lowercase character</li>
              <li>Password must include at least one uppercase character</li>
            </ul>
            <div className="text-right">
              <button className="px-6 py-2 bg-gradient-to-r from-[#00bfff] to-[#1e90ff] text-white rounded-lg hover:from-[#00bfff]/90 hover:to-[#1e90ff]/90 transition-all duration-300">
                Save all
              </button>
            </div>
          </div> */}
        </div>

        {/* Right Side (Profile + Settings) */}
        <div className="bg-black/50 rounded-xl border border-[#00ffff]/25 p-6 shadow-sm">
          <div className="p-4 rounded-2xl">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              Competition Instructions
            </h2>

            <ul className="list-disc list-inside space-y-2 text-slate-300 text-sm leading-relaxed">
              <li>
                Do not share <strong className="text-white">flags</strong> with
                anyone.
              </li>
              <li>
                Do not update or leak your{" "}
                <strong className="text-white">personal data</strong>.
              </li>
              <li>
                Do not share <strong className="text-white">hints</strong>{" "}
                publicly.
              </li>
              <li>
                For teaming up, ask for{" "}
                <strong className="text-white">instructions</strong> before
                proceeding.
              </li>
              <li>
                If you face any issue, reach out to{" "}
                <strong className="text-white">our support team</strong>.
              </li>
              <li>
                Do not forget your{" "}
                <strong className="text-white">password</strong>. You cannot
                change it yourself — contact organisers if required.
              </li>
              <li>
                The event will{" "}
                <strong className="text-white">
                  end at the exact scheduled time
                </strong>
                , no extensions.
              </li>
              <li>
                <strong className="text-white">Linux</strong> environment is
                recommended for the CTF challenges.
              </li>
              <li>
                We keep your data safe. Your{" "}
                <strong className="text-white">personal data</strong> will only
                be used for certificate generation.
              </li>
            </ul>

            <div className="mt-3 space-y-1 text-xs text-slate-400">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" /> Team collaboration is encouraged,
                but stay fair.
              </div>
              <div className="flex items-center gap-1">
                <HelpCircle className="w-3 h-3" /> Contact support for any
                disputes or doubts.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
