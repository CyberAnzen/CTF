import React from "react";
import { Trophy, Star, Flag, HelpCircle } from "lucide-react";

export default function TeamRanking({ ranking = [], contributions = {} }) {
  const totalTeamScore = Object.values(contributions).reduce(
    (sum, contrib) => sum + contrib.score,
    0
  );

  return (
    <div className="bg-black/50 rounded-xl border border-[#01ffdb]/15 p-4 h-full flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-[#01ffdb]">Team Rankings</h2>
        <Trophy className="w-5 h-5 text-[#01ffdb]/70" />
      </div>

      {/* Scrollable list: responsive maxHeight so it fits available viewport space */}
      <div
        className="space-y-3 overflow-y-auto pr-2 team-scrollbar"
        style={{
          // adaptively fill remaining screen space but leave room for header/stats
          maxHeight: "calc(100vh - 360px)",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {ranking.map((member, index) => {
          const scorePercentage =
            totalTeamScore > 0 ? (member.score / totalTeamScore) * 100 : 0;

          return (
            <div
              key={member.username + index}
              className={`
                flex items-center justify-between gap-3 p-3 rounded-lg border
                transition-transform duration-200 ease-out transform-gpu
                ${
                  index === 0
                    ? "bg-yellow-500/8 border-yellow-500/30"
                    : "bg-white/2 border-[#01ffdb]/10"
                }
                hover:scale-[1.01]`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 text-sm font-semibold ${
                    index === 0
                      ? "bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/40"
                      : "bg-[#01ffdb]/10 text-[#01ffdb]"
                  }`}
                >
                  {index + 1}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-white text-sm font-medium truncate">
                      {member.username}
                    </h4>
                    <span className="text-xs text-[#01ffdb]/50">· Member</span>
                  </div>

                  {/* mini stats row */}
                  <div className="flex items-center gap-3 mt-1 text-xs">
                    <div className="flex items-center gap-1 text-[#01ffdb]/60">
                      <Star className="w-3 h-3" />
                      <span className="truncate">
                        {member.score.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-green-300/80">
                      <Flag className="w-3 h-3" />
                      <span>{member.flags}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sky-300/80">
                      <HelpCircle className="w-3 h-3" />
                      <span>{member.hints}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side: compact progress + trophy for leader */}
              <div className="flex flex-col items-end min-w-[110px]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-xs text-[#01ffdb]/60">
                    {scorePercentage.toFixed(1)}%
                  </div>
                  {index === 0 && (
                    <Trophy className="w-4 h-4 text-yellow-400" />
                  )}
                </div>

                <div className="w-[110px]">
                  <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden">
                    <div
                      role="progressbar"
                      aria-valuenow={Math.round(scorePercentage)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      className={`h-2 rounded-full transition-all duration-800 ease-out
                        ${
                          index === 0
                            ? "bg-gradient-to-r from-yellow-400 to-yellow-200"
                            : "bg-gradient-to-r from-[#01ffdb] to-blue-500"
                        }`}
                      style={{ width: `${Math.min(100, scorePercentage)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {ranking.length === 0 && (
          <div className="text-center text-sm text-[#01ffdb]/60 py-6">
            No ranking data available
          </div>
        )}
      </div>

      {/* optional footer summary */}
      <div className="mt-4 pt-3 border-t border-white/5 text-xs text-[#01ffdb]/60 flex items-center justify-between">
        <div>Total contributors: {ranking.length}</div>
        <div>
          Total score:{" "}
          <span className="text-white font-medium">
            {Object.values(contributions)
              .reduce((s, c) => s + c.score, 0)
              .toLocaleString()}
          </span>
        </div>
      </div>

      {/* Styles for a sleek neon scrollbar (webkit + firefox) */}
      <style>{`
        /* WebKit */
        .team-scrollbar::-webkit-scrollbar { width: 9px; }
        .team-scrollbar::-webkit-scrollbar-track { background: transparent; border-radius: 999px; }
        .team-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(1,255,219,0.18), rgba(0,128,255,0.12));
          border-radius: 999px;
          border: 2px solid rgba(0,0,0,0.18);
        }
        .team-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, rgba(1,255,219,0.28), rgba(0,128,255,0.18));
        }

        /* Firefox */
        .team-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(1,255,219,0.18) transparent; }

        /* ensure inner cards don't force container to expand */
        .team-scrollbar > * { min-height: 0; }
      `}</style>
    </div>
  );
}
