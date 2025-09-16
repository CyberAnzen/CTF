import { useEffect, useState } from "react";
import { Shield, Zap, Trophy, Target, Star, TrendingUp } from "lucide-react";
import SemicircleProgress from "./dashboard/SemicircleProgress";
import StatCard from "./dashboard/StatCard";
import ChallengeCard from "./dashboard/ChallengeCard";
import TeamRanking from "./dashboard/TeamRanking";
import RecentActivity from "./dashboard/RecentActivity";
import QuickActions from "./dashboard/QuickActions";
import { useAppContext } from "../../context/AppContext";

export default function Dashboard({ isTeam = true }) {
  const [openId, setOpenId] = useState(null);
  const { progress, fetchProgress } = useAppContext();
  useEffect(() => {
    setTimeout(() => {
      fetchProgress();
      setInterval(() => {
        fetchProgress();
      }, 10000);
    }, 10000);
  }, []);
  console.log(progress);
  if (!progress) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="loader mb-4"></div>
          <p className="text-[#00ffff]/60 text-lg">Loading Dashboard...</p>
        </div>
      </div>
    );
  }
  // Calculate stats
  const totalScore = isTeam
    ? Object.values(progress?.contributions || {}).reduce(
        (sum, contrib) => sum + contrib.score,
        0
      )
    : progress?.challenges.reduce((sum, challenge) => sum + challenge.score, 0);

  const completedChallenges = progress?.challenges.filter(
    (c) => c.Flag_Submitted
  );
  const completionPercentage =
    (progress?.completedChallenges / progress?.totalChallenges) * 100;
  const averageScore =
    completedChallenges.length > 0
      ? completedChallenges.reduce((sum, c) => sum + c.score, 0) /
        completedChallenges.length
      : 0;
  const hintsUsed = progress?.challenges.reduce(
    (sum, challenge) => sum + challenge.unlockedHints,
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
        {/* Header */}
        {/* <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-[#00ffff] mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#00ffff] via-blue-400 to-[#00ffff] bg-clip-text text-transparent">
              CTF Progress Dashboard
            </h1>
            <Zap className="w-8 h-8 text-[#00ffff] ml-3" />
          </div>
          <p className="text-[#00ffff]/60 text-lg">
            {isTeam
              ? "Team Performance Tracker"
              : "Individual Progress Monitor"}
          </p>
        </div> */}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Score"
            value={totalScore.toLocaleString()}
            icon={Star}
            trend="up"
            trendValue="+12%"
          />
          <StatCard
            title="Completion Rate"
            value={`${completionPercentage.toFixed(1)}%`}
            icon={Target}
            trend="up"
            trendValue="+5%"
          />
          <StatCard
            title="Challenges Solved"
            value={`${progress?.completedChallenges}/${progress?.totalChallenges}`}
            icon={Trophy}
            trend="up"
            trendValue="+3"
          />
          <StatCard
            title="Average Score"
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
                  percentage={completionPercentage}
                  size={200}
                  strokeWidth={12}
                  label="Complete"
                  value={`${Math.round(completionPercentage)}%`}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-[#00ffff]/5 rounded-lg border border-[#00ffff]/20">
                  <div className="text-lg font-bold text-white">
                    {progress?.totalChallenges}
                  </div>
                  <div className="text-[#00ffff]/60 text-xs">Total</div>
                </div>
                <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                  <div className="text-lg font-bold text-white">
                    {progress?.completedChallenges}
                  </div>
                  <div className="text-green-400/60 text-xs">Completed</div>
                </div>
                <div className="text-center p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                  <div className="text-lg font-bold text-white">
                    {progress?.totalChallenges - progress?.completedChallenges}
                  </div>
                  <div className="text-red-400/60 text-xs">Remaining</div>
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

          {/* Quick Actions */}
          {/* <div className="lg:col-span-1">
            <QuickActions />
          </div> */}
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
            {progress?.challenges.length === 0 && (
              <div className="text-center py-8">
                <p className="text-[#00ffff]/50">No progress available</p>
              </div>
            )}
            {progress?.challenges
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
