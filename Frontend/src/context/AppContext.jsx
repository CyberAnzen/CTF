import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FingerPrintJS from "../../utils/Fingerprint";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const navigate = useNavigate();
  const [ChallengesData, setChallengesData] = useState(null);

  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState(null);
  const [savedSkills, setSavedSkills] = useState([]);
  const [savedLinks, setSavedLinks] = useState(null);
  const [LearnAdd, setLearnAdd] = useState(false);
  const [Admin, setAdmin] = useState(false);
  const [classificationId, setClassificationId] = useState();
  const [fp, setFp] = useState(null);
  const [csrf, setCSRF] = useState(null);
  const [progress, setProgress] = useState(null);
  // Generate fingerprint once
  const getFingerprint = async () => {
    if (fp) return fp;
    try {
      const fingerprint = await FingerPrintJS();
      setFp(fingerprint);
      return fingerprint;
    } catch (error) {
      console.error("Failed to generate fingerprint:", error);
      return null;
    }
  };

  // Fetch CSRF token once per fingerprint
  const getCsrf = async () => {
    if (csrf) return csrf;
    const fingerprint = await getFingerprint();
    if (!fingerprint) return null;

    try {
      const res = await fetch(`${BACKEND_URL}/auth/csrf-token`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "x-client-fp": fingerprint,
          timestamp: Date.now(),
        },
      });

      if (!res.ok) throw new Error("Failed to fetch CSRF token");

      const data = await res.json();
      setCSRF(data.csrfToken);
      return data.csrfToken;
    } catch (error) {
      console.error("CSRF fetch failed:", error);
      return null;
    }
  };

  const fetchProfile = async () => {
    const fingerprint = await getFingerprint();
    const csrfToken = await getCsrf();
    if (!fingerprint || !csrfToken) return null;

    try {
      const res = await fetch(`${BACKEND_URL}/profile/data`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "x-client-fp": fingerprint,
          "x-csrf-token": csrfToken,
          timestamp: Date.now(),
        },
      });

      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();

      setUser(data?.data || null);
      setAdmin(data?.data?.userRole === "Admin");
      setLoggedIn(Boolean(data?.data));
      return data?.data || null;
    } catch (error) {
      console.error("Profile fetch failed:", error);
      setUser(null);
      setAdmin(false);
      setLoggedIn(false);
      return null;
    }
  };

  const fetchTeam = async () => {
    const fingerprint = await getFingerprint();
    const csrfToken = await getCsrf();
    if (!fingerprint || !csrfToken) return null;

    try {
      const res = await fetch(`${BACKEND_URL}/team`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "x-client-fp": fingerprint,
          "x-csrf-token": csrfToken,
          timestamp: Date.now(),
        },
      });

      if (!res.ok) {
        if (res.status === 404) {
          setTeam(null);
          return null;
        }
        throw new Error("Failed to fetch team");
      }

      const data = await res.json();
      setTeam(data?.data || null);
      return data?.data || null;
    } catch (error) {
      console.error("Team fetch failed:", error);
      setTeam(null);
      return null;
    }
  };

  const fetchProgress = async () => {
    const fingerprint = await getFingerprint();
    const csrfToken = await getCsrf();
    if (!fingerprint || !csrfToken) return null;

    try {
      const res = await fetch(`${BACKEND_URL}/challenge/progress`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "x-client-fp": fingerprint,
          "x-csrf-token": csrfToken,
          timestamp: Date.now(),
        },
      });

      if (!res.ok) {
        if (res.status === 404) {
          setProgress(null);
          return null;
        }
        throw new Error("Failed to fetch progress");
      }

      const data = await res.json();
      setProgress(data?.progress || null);
      return data?.progress || null;
    } catch (error) {
      console.error("Progress fetch failed:", error);
      setProgress(null);
      return null;
    }
  };

  const logout = async () => {
    try {
      await fetch(`${BACKEND_URL}/user/logout`, {
        method: "GET",
        credentials: "include",
      });
    } catch (err) {
      console.error("Backend logout failed:", err);
    } finally {
      setLoggedIn(false);
      setUser(null);
      setTeam(null);
      setAdmin(false);
      setCSRF(null);
      navigate("/login");
    }
  };

  // Initialize context once on mount
  useEffect(() => {
    const init = async () => {
      await fetchProfile();
      await fetchTeam();
      await fetchProgress();
    };
    init();
  }, []);

  const value = {
    navigate,
    user,
    setUser,
    savedSkills,
    setSavedSkills,
    savedLinks,
    setSavedLinks,
    LearnAdd,
    setLearnAdd,
    Admin,
    classificationId,
    setClassificationId,
    fp,
    csrf,
    loggedIn,
    setLoggedIn,
    logout,
    team,
    setTeam,
    fetchProfile,
    fetchTeam,
    ChallengesData,
    setChallengesData,
    progress,
    fetchProgress,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
