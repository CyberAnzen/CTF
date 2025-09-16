import { useEffect, useState, useRef } from "react";
import {
  Shield,
  Zap,
  Trophy,
  Target,
  Star,
  TrendingUp,
  Hash,
} from "lucide-react";
import SemicircleProgress from "./dashboard/SemicircleProgress";
import StatCard from "./dashboard/StatCard";
import ChallengeCard from "./dashboard/ChallengeCard";
import TeamRanking from "./dashboard/TeamRanking";
import RecentActivity from "./dashboard/RecentActivity";
import QuickActions from "./dashboard/QuickActions";
import { useAppContext } from "../../context/AppContext";
import { useSocket } from "../../context/useSocket";
import getRankDetails from "../../../utils/getRankDetails";
import Team from "./Team";
import { HashtagIcon } from "@heroicons/react/24/solid";
import Usefetch from "../../hooks/Usefetch";

export default function Dashboard({
  isTeam = true,
  self = true,
  viewId = null,
}) {
  const [openId, setOpenId] = useState(null);
  const { progress: Myprogress, fetchProgress } = useAppContext();
  const { user, team } = useAppContext();
  const [Rank, setRank] = useState(null);
  const [endpoint, setEndpoint] = useState(null);
  const [progress, setProgress] = useState(Myprogress);

  // Usefetch returns Data, error, loading, retry
  const {
    Data: Progress,
    error: fetchError,
    loading,
    retry: fetchRetry,
  } = Usefetch(endpoint, "get", null, {}, false);

  // -- Refs to avoid effects retriggering because function identities change
  const lastEndpointRef = useRef(null);
  const fetchRetryRef = useRef(fetchRetry);
  const fetchProgressRef = useRef(fetchProgress);

  // keep refs up-to-date when identities change
  useEffect(() => {
    fetchRetryRef.current = fetchRetry;
  }, [fetchRetry]);

  useEffect(() => {
    fetchProgressRef.current = fetchProgress;
  }, [fetchProgress]);

  // 1) set endpoint when viewId/self changes (do NOT call fetchRetry here)
  useEffect(() => {
    if (!self && viewId) {
      const id = viewId.id ?? viewId._id ?? viewId;
      if (viewId.isTeam) {
        setEndpoint(`challenge/progress/team/${id}`);
      } else {
        setEndpoint(`challenge/progress/user/${id}`);
      }
    } else {
      // viewing self — clear endpoint so fetch hook doesn't try to fetch stale data
      setEndpoint(null);
    }
  }, [self, viewId]);

  // 2) trigger fetchRetry when endpoint actually changes (safe place to call retry)
  useEffect(() => {
    if (!endpoint) {
      lastEndpointRef.current = null;
      return;
    }

    // only call retry when endpoint changed from previous value
    if (lastEndpointRef.current !== endpoint) {
      lastEndpointRef.current = endpoint;
      // call the latest fetchRetry from the ref (avoids infinite loops if fetchRetry identity keeps changing)
      if (fetchRetryRef.current) fetchRetryRef.current();
    }
  }, [endpoint]);

  // 3) Poll/refresh personal progress when self is true
  useEffect(() => {
    if (!self) return;
    // call the stable ref directly
    if (fetchProgressRef.current) fetchProgressRef.current();

    const interval = setInterval(() => {
      if (fetchProgressRef.current) fetchProgressRef.current();
    }, 15000);
    return () => clearInterval(interval);
  }, [self]);

  // 4) Sync the progress state depending on self vs fetched Progress
  //    -> Always prefer Myprogress when self === true
  //    -> When viewing another (self === false), prefer Progress as soon as it arrives
  useEffect(() => {
    if (self) {
      if (Myprogress) setProgress(Myprogress);
      else setProgress(null);
    } else {
      if (Progress) setProgress(Progress?.progress);
      else setProgress(null);
    }
  }, [self, Progress, Myprogress]);

  // 5) Leaderboard-derived rank calculation (robust to viewId.id or viewId._id)
  const {
    leaderboardData = [],
    clientCount,
    isConnected,
    reconnect,
  } = useSocket();
  useEffect(() => {
    if (!leaderboardData?.length) return;

    let rank = null;
    if (self) {
      rank = getRankDetails(
        leaderboardData,
        team ? "team" : "solo",
        team ? team?._id : user?._id
      );
    } else if (viewId) {
      const targetId = viewId._id ?? viewId.id ?? viewId;
      rank = getRankDetails(
        leaderboardData,
        viewId.isTeam ? "team" : "solo",
        targetId
      );
    }

    setRank(rank);
  }, [leaderboardData, team, user, viewId, self]);

  // — Defensive derived values
  const completedChallenges =
    progress?.challenges?.filter((c) => c.Flag_Submitted) || [];
  const completionPercentage =
    progress?.totalChallenges > 0
      ? (progress?.completedChallenges / progress?.totalChallenges) * 100
      : 0;
  const averageScore =
    completedChallenges?.length > 0
      ? completedChallenges.reduce((sum, c) => sum + (c.score || 0), 0) /
        completedChallenges.length
      : 0;

  // — Loading & Error UI logic
  // Consider we have usable data if either:
  // - progress state is set from Myprogress (self), or
  // - Progress (fetched) exists and was synced into progress
  const haveProgress = !!progress;

  // Show loading screen when we do NOT have usable progress AND the fetch is in-flight or endpoint is set
  const showLoading =
    !haveProgress && (loading || (!self && !!endpoint && !Progress));

  if (showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="loader mb-4" />
          <p className="text-[#00ffff]/60 text-lg">Fetching progress...</p>
        </div>
      </div>
    );
  }

  // If fetch returned an error and we don't have any progress to show, show error screen
  if (fetchError && !haveProgress) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-red-400 mb-4">
            Failed to load progress data.{" "}
            {fetchError?.message ? `(${fetchError.message})` : ""}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={fetchRetry}
              className="px-4 py-2 bg-[#00ffff]/20 border border-[#00ffff]/40 rounded-md hover:bg-[#00ffff]/30 transition"
            >
              Retry
            </button>
            <button
              onClick={() => {
                // fallback: attempt to fetch local progress if available
                fetchProgress();
              }}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-md hover:bg-white/6 transition"
            >
              Fetch Local Progress
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If we still don't have progress (e.g., fetch completed but returned empty), show neutral message
  if (!haveProgress) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="loader mb-4" />
          <p className="text-[#00ffff]/60 text-lg">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  // — Normal dashboard render
  const totalScore = isTeam
    ? Object.values(progress?.contributions || {})?.reduce(
        (sum, contrib) => sum + (contrib.score || 0),
        0
      )
    : (progress?.challenges || []).reduce(
        (sum, challenge) => sum + (challenge.score || 0),
        0
      );

  const hintsUsed = (progress?.challenges || []).reduce(
    (sum, challenge) => sum + (challenge.unlockedHints || 0),
    0
  );

  return (
    <div className="min-h-screen  p-6">
      {/* Animated Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#00ffff]/5 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="LeaderBoard Rank"
            value={Rank ? `#${Rank?.rank}` : "N/A"}
            icon={HashtagIcon}
            trend="up"
            trendValue="+12%"
          />
          <StatCard
            title="Completion Rate"
            value={`${(completionPercentage || 0).toFixed(1)}%`}
            icon={Target}
            trend="up"
            trendValue="+5%"
          />
          <StatCard
            title="Challenges Solved"
            value={`${progress?.completedChallenges ?? 0}/${
              progress?.totalChallenges ?? 0
            }`}
            icon={Trophy}
            trend="up"
            trendValue="+3"
          />
          <StatCard
            title="Total Score"
            value={
              averageScore ? Math.round(averageScore).toLocaleString() : "N/A"
            }
            icon={TrendingUp}
            trend="up"
            trendValue="+8%"
          />
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Progress Overview */}
          <div className="lg:col-span-1">
            <div className="bg-black/50 rounded-xl border border-[#00ffff]/25 p-6 h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-[#00ffff]">
                  Overall Progress
                </h2>
                <Trophy className="w-6 h-6 text-[#00ffff]/70" />
              </div>

              <div className="flex justify-center mb-6">
                <SemicircleProgress
                  percentage={completionPercentage || 0}
                  size={200}
                  strokeWidth={12}
                  label="Complete"
                  value={`${Math.round(completionPercentage || 0)}%`}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-[#00ffff]/5 rounded-lg border  justify-center items-center flex flex-col border-[#00ffff]/20">
                  <div className="text-lg font-bold text-white">
                    {progress?.totalChallenges ?? 0}
                  </div>
                  <div className="text-[#00ffff]/60 text-[0.6rem]">Total</div>
                </div>
                <div className="text-center p-3 bg-green-500/10 rounded-lg border  justify-center items-center flex flex-col border-green-500/30 ">
                  <div className="text-lg font-bold text-white">
                    {progress?.completedChallenges ?? 0}
                  </div>
                  <div className="text-green-400/60 text-[0.6rem]">
                    Completed
                  </div>
                </div>
                <div className="text-center p-3 bg-red-500/10 rounded-lg border justify-center items-center flex flex-col border-red-500/30">
                  <div className="text-lg font-bold text-white">
                    {(progress?.totalChallenges ?? 0) -
                      (progress?.completedChallenges ?? 0)}
                  </div>
                  <div className="text-red-400/60 text-[0.6rem]">Remaining</div>
                </div>
              </div>
            </div>
          </div>

          {/* Team Ranking or Recent Activity */}
          <div className="lg:col-span-2">
            {isTeam && progress?.ranking ? (
              <TeamRanking
                ranking={progress?.ranking}
                contributions={progress?.contributions}
              />
            ) : (
              <RecentActivity challenges={progress?.challenges} />
            )}
          </div>
        </div>

        {/* Challenges Grid */}
        <div>
          <div className="flex items-center mb-6">
            <h2 className="text-2xl font-bold text-[#00ffff] mr-3">
              Challenge Details
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-[#00ffff]/50 to-transparent" />
          </div>

          <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {(!progress?.challenges || progress?.challenges?.length === 0) && (
              <div className="text-center py-8">
                <p className="text-[#00ffff]/50">No progress available</p>
              </div>
            )}
            {(progress?.challenges || [])
              .slice()
              .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
              .map((challenge) => (
                <ChallengeCard
                  key={challenge._id}
                  challenge={challenge}
                  isOpen={openId === challenge._id}
                  onToggle={() =>
                    setOpenId(openId === challenge._id ? null : challenge._id)
                  }
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
