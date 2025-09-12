import { useState } from "react";
import { Shield, Zap, Trophy, Target, Star, TrendingUp } from "lucide-react";
import SemicircleProgress from "./dashboard/SemicircleProgress";
import StatCard from "./dashboard/StatCard";
import ChallengeCard from "./dashboard/ChallengeCard";
import TeamRanking from "./dashboard/TeamRanking";
import RecentActivity from "./dashboard/RecentActivity";
import QuickActions from "./dashboard/QuickActions";

// Sample data structure
const sampleTeamData = {
  message: "progress fetched successfully",
  progress: {
    totalChallenges: 4,
    completedChallenges: 3,
    challenges: [
      {
        _id: "68ab2225441536d7a4a4b1a0",
        challengeId: "68931a2948dd7bf59d997afd",
        teamId: "68a7406603446005ea759160",
        Flag_Submitted: true,
        __v: 0,
        attempt: 0,
        createdAt: "2025-08-24T14:31:01.059Z",
        hints: [
          {
            hintId: "6899e2ec8f5647bcfde66c45",
            used: false,
            _id: "68ab2225969a1a4cec8c008c",
          },
          {
            hintId: "6899e2ec8f5647bcfde66c46",
            used: false,
            _id: "68ab2225969a1a4cec8c008d",
          },
          {
            hintId: "6899e2f98f5647bcfde66c56",
            used: false,
            _id: "68ab2225969a1a4cec8c008e",
          },
          {
            hintId: "6899e2ec8f5647bcfde66c48",
            used: false,
            _id: "68ab2225969a1a4cec8c008f",
          },
          {
            hintId: "689aced29de892b8965673b6",
            used: false,
            _id: "68ab2225969a1a4cec8c0090",
          },
        ],
        score: 2332,
        updatedAt: "2025-08-24T14:31:06.286Z",
        submittedBy: "Vetrivel",
        title: "Web Pentesting",
        description:
          "This challenge is dfssdnfsjdf sf sd fds f sad f asdf sda f asdf sda f sdaf sd f sadf sdg df gd f gfnfg h dgf df g fds gsd f sdg fds g dfg dfs gdf g dsfg df g dsf ds gdf  dfg dsfgdf\r\n\r\nfddf\r\ndfgdfg dfg df\r\ng\r\ndfg\r\ndf\r\ngdf\r\ngd\r\nf fbfgdgfdgdfgdsfgdsfgdf sg dfdfg dsfg dsfgd sfg df gdfs\r\ndf\r\ng dfg\r\ndf gdfs g sdfg bdfs gg gbased on the pentesting a web server.",
        category: "Burp Suite",
        difficulty: "hard",
        tags: ["fdgk;odsfgk"],
        totalHints: 5,
        unlockedHints: 0,
        completionTime: "2025-08-24 20:01:06",
      },
      {
        _id: "68ab2348441536d7a4a4b1a1",
        challengeId: "68931f5148dd7bf59d997b0e",
        teamId: "68a7406603446005ea759160",
        Flag_Submitted: true,
        __v: 0,
        attempt: 0,
        createdAt: "2025-08-24T14:35:52.672Z",
        hints: [
          {
            hintId: "68931f5148dd7bf59d997b0f",
            used: false,
            _id: "68ab2348678fa14fa04b5998",
          },
        ],
        score: 324,
        updatedAt: "2025-08-24T14:36:10.062Z",
        submittedBy: "Vetrivel",
        title: "fsadfksdjfwefdf",
        description: "adsfsafsdf",
        category: "sdijfsadif",
        difficulty: "advanced",
        tags: ["dsfsdaf"],
        totalHints: 1,
        unlockedHints: 0,
        completionTime: "2025-08-24 20:06:10",
      },
      {
        _id: "68ac7876038cefc1291a64eb",
        challengeId: "68931a4248dd7bf59d997b01",
        teamId: "68a7406603446005ea759160",
        Flag_Submitted: false,
        __v: 0,
        attempt: 0,
        createdAt: "2025-08-25T14:51:34.406Z",
        hints: [
          {
            hintId: "68931a4248dd7bf59d997b02",
            used: false,
            _id: "68ac78767b4794a3ab6bb3da",
          },
        ],
        score: 324,
        updatedAt: "2025-08-25T14:51:34.406Z",
        submittedBy: null,
        title: "fsadfksdjf",
        description: "dfkljadska",
        category: "sdijfsadif",
        difficulty: "easy",
        tags: ["fksdkf"],
        totalHints: 1,
        unlockedHints: 0,
        completionTime: null,
      },
      {
        _id: "68c465eec5a68378e9ed8e85",
        challengeId: "68a6c76500d96b4374dbb382",
        teamId: "68a7406603446005ea759160",
        Flag_Submitted: true,
        __v: 0,
        attempt: 0,
        createdAt: "2025-09-12T18:26:54.484Z",
        hints: [
          {
            hintId: "68a6c76500d96b4374dbb383",
            used: true,
            _id: "68c465ee55c077f7796f8201",
            usedAt: "2025-09-12T18:26:56.515Z",
            usedBy: {
              _id: "689b7f0d5d74209679b0ddf3",
              username: "Vetrivels",
            },
          },
        ],
        score: 62011,
        updatedAt: "2025-09-12T18:27:24.349Z",
        submittedBy: "Vetrivels",
        title: "hjghghgh",
        description: "gyukfkyugfyukgykgygk",
        category: "gygghjghjghj",
        difficulty: "easy",
        tags: ["ftyyfgykygkygk"],
        totalHints: 1,
        unlockedHints: 1,
        completionTime: "2025-09-12 23:57:24",
      },
    ],
    contributions: {
      Vetrivel: {
        score: 2656,
        flags: 2,
        hints: 0,
      },
      Vetrivels: {
        score: 62011,
        flags: 1,
        hints: 1,
      },
    },
    ranking: [
      {
        username: "Vetrivels",
        flags: 1,
        hints: 1,
        score: 62011,
      },
      {
        username: "Vetrivel",
        flags: 2,
        hints: 0,
        score: 2656,
      },
      {
        username: "Vetrivel",
        flags: 2,
        hints: 0,
        score: 2656,
      },
      {
        username: "Vetrivel",
        flags: 2,
        hints: 0,
        score: 2656,
      },
    ],
  },
};

export default function Dashboard({ data = sampleTeamData, isTeam = true }) {
  const { progress } = data;
  const [openId, setOpenId] = useState(null);

  // Calculate stats
  const totalScore = isTeam
    ? Object.values(progress.contributions || {}).reduce(
        (sum, contrib) => sum + contrib.score,
        0
      )
    : progress.challenges.reduce((sum, challenge) => sum + challenge.score, 0);

  const completedChallenges = progress.challenges.filter(
    (c) => c.Flag_Submitted
  );
  const completionPercentage =
    (progress.completedChallenges / progress.totalChallenges) * 100;
  const averageScore =
    completedChallenges.length > 0
      ? completedChallenges.reduce((sum, c) => sum + c.score, 0) /
        completedChallenges.length
      : 0;
  const hintsUsed = progress.challenges.reduce(
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
            value={`${progress.completedChallenges}/${progress.totalChallenges}`}
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
                    {progress.totalChallenges}
                  </div>
                  <div className="text-[#00ffff]/60 text-xs">Total</div>
                </div>
                <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                  <div className="text-lg font-bold text-white">
                    {progress.completedChallenges}
                  </div>
                  <div className="text-green-400/60 text-xs">Completed</div>
                </div>
                <div className="text-center p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                  <div className="text-lg font-bold text-white">
                    {progress.totalChallenges - progress.completedChallenges}
                  </div>
                  <div className="text-red-400/60 text-xs">Remaining</div>
                </div>
              </div>
            </div>
          </div>

          {/* Team Ranking or Recent Activity */}
          <div className="lg:col-span-2">
            {isTeam && progress.ranking ? (
              <TeamRanking
                ranking={progress.ranking}
                contributions={progress.contributions}
              />
            ) : (
              <RecentActivity challenges={progress.challenges} />
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
            {progress.challenges
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
