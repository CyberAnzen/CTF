import React from "react";
import {
  CheckCircle2,
  Circle,
  Star,
  Clock,
  User,
  HelpCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const difficultyColors = {
  easy: "border-green-500/40 bg-green-500/6 text-green-400",
  intermediate: "border-yellow-500/40 bg-yellow-500/6 text-yellow-400",
  advanced: "border-orange-500/40 bg-orange-500/6 text-orange-400",
  hard: "border-red-500/40 bg-red-500/6 text-red-400",
};

export default function ChallengeCard({ challenge = {}, isOpen, onToggle }) {
  const isCompleted = !!challenge?.Flag_Submitted;
  const difficulty = (challenge?.difficulty || "easy").toLowerCase();
  const difficultyColor = difficultyColors[difficulty] || difficultyColors.easy;
  const usedHints = (challenge?.hints || []).filter((h) => h?.used) || [];
  const score = Number(challenge?.score) || 0;
  const attempts = Number(challenge?.attempt) || 0;
  const unlockedHints = Number(challenge?.unlockedHints) || 0;
  const totalHints = Number(challenge?.totalHints) || 0;

  return (
    <div
      className={`w-full rounded-xl backdrop-blur-md transition-all duration-300
        border ${isCompleted ? "ring-1 ring-green-500/30" : "ring-0"}
        bg-[linear-gradient(180deg,rgba(1,255,219,0.04),rgba(0,0,0,0.18))] border-[#01ffdb]/15 shadow-sm`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-[#01ffdb]/6 rounded-t-xl"
      >
        <div className="flex items-center space-x-3">
          {isCompleted ? (
            <CheckCircle2 className="w-6 h-6 text-green-400" />
          ) : (
            <Circle className="w-6 h-6 text-[#01ffdb]/70" />
          )}
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-[#01ffdb] truncate max-w-[320px]">
              {challenge?.title || "Untitled Challenge"}
            </h3>
            <p className="text-[#01ffdb]/60 text-xs truncate max-w-[320px]">
              {challenge?.category || "Uncategorized"}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-[#ffd34d]" />
            <span className="text-white font-medium text-sm">
              {score.toLocaleString()}
            </span>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium border ${difficultyColor}`}
          >
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: "easeInOut" }}
            className="overflow-hidden px-4 pb-4"
          >
            <p className="text-[#01ffdb]/70 text-sm mb-3">
              {challenge?.description || "No description available."}
            </p>

            <div className="flex items-center justify-between mb-4 text-[#01ffdb]/65">
              {attempts > 0 && (
                <span className="text-xs">Attempts: {attempts}</span>
              )}
              <span className="flex items-center text-sm">
                <HelpCircle className="w-4 h-4 mr-1" />
                {unlockedHints}/{totalHints}
              </span>
            </div>

            {isCompleted && challenge?.completionTime && (
              <div className="flex items-center justify-between pt-3 border-t border-[#01ffdb]/12">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 text-sm">
                    {new Date(challenge.completionTime).toLocaleString()}
                  </span>
                </div>
                {challenge?.submittedBy && (
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-[#01ffdb]/60" />
                    <span className="text-[#01ffdb]/60 text-sm">
                      {challenge.submittedBy}
                    </span>
                  </div>
                )}
              </div>
            )}

            {usedHints.length > 0 && (
              <div className="mt-3 p-3 rounded-lg bg-[rgba(1,255,219,0.04)] border border-[#01ffdb]/12">
                <p className="text-[#01ffdb]/70 text-sm mb-2 font-medium">
                  Hints Used ({usedHints.length}):
                </p>
                <ul className="space-y-1">
                  {usedHints.map((hint, index) => (
                    <li
                      key={hint?._id || index}
                      className="text-xs text-[#01ffdb]/80 flex items-center space-x-2"
                    >
                      <HelpCircle className="w-3 h-3" />
                      <span>Hint ID: {hint?.hintId ?? hint?.id ?? index}</span>
                      {hint?.usedBy?.username && (
                        <span className="text-white">
                          by {hint.usedBy.username}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {Array.isArray(challenge?.tags) && challenge.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {challenge.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-[#01ffdb]/8 text-[#01ffdb]/70 text-xs rounded-md"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
