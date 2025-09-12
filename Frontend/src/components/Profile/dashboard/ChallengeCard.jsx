import React, { useState } from "react";
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
  easy: "border-green-500/50 bg-green-500/10 text-green-400",
  intermediate: "border-yellow-500/50 bg-yellow-500/10 text-yellow-400",
  advanced: "border-orange-500/50 bg-orange-500/10 text-orange-400",
  hard: "border-red-500/50 bg-red-500/10 text-red-400",
};

export default function ChallengeCard({ challenge, isOpen, onToggle }) {
  const isCompleted = challenge.Flag_Submitted;
  const difficultyColor = difficultyColors[challenge.difficulty];
  const usedHints = challenge.hints?.filter((h) => h.used) || [];

  return (
    <div
      className={`w-full bg-black/50 rounded-xl border border-[#01ffdb]/25 backdrop-blur-sm 
        transition-all duration-300 hover:border-[#01ffdb]/40 hover:shadow-lg hover:shadow-[#01ffdb]/10 
        ${isCompleted ? "ring-1 ring-green-500/30" : ""}`}
    >
      {/* Header (always visible) */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center space-x-3">
          {isCompleted ? (
            <CheckCircle2 className="w-6 h-6 text-green-400" />
          ) : (
            <Circle className="w-6 h-6 text-[#01ffdb]/60" />
          )}
          <div>
            <h3 className="text-base font-semibold text-white truncate max-w-[200px]">
              {challenge.title}
            </h3>
            <p className="text-[#01ffdb]/60 text-xs">{challenge.category}</p>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="text-white font-medium text-sm">
              {challenge.score.toLocaleString()}
            </span>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium border ${difficultyColor}`}
          >
            {challenge.difficulty.charAt(0).toUpperCase() +
              challenge.difficulty.slice(1)}
          </div>
        </div>
      </button>

      {/* Expandable Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden px-4 pb-4"
          >
            <p className="text-[#01ffdb]/70 text-sm mb-3">
              {challenge.description}
            </p>

            <div className="flex items-center justify-between mb-4">
              {challenge.attempt > 0 && (
                <span className="text-xs text-[#01ffdb]/60">
                  Attempts: {challenge.attempt}
                </span>
              )}
              <span className="flex items-center text-[#01ffdb]/60 text-sm">
                <HelpCircle className="w-4 h-4 mr-1" />
                {challenge.unlockedHints}/{challenge.totalHints}
              </span>
            </div>

            {isCompleted && challenge.completionTime && (
              <div className="flex items-center justify-between pt-3 border-t border-[#01ffdb]/20">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 text-sm">
                    {new Date(challenge.completionTime).toLocaleString()}
                  </span>
                </div>
                {challenge.submittedBy && (
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
              <div className="mt-3 p-3 rounded-lg bg-[#01ffdb]/5 border border-[#01ffdb]/20">
                <p className="text-[#01ffdb]/70 text-sm mb-2 font-medium">
                  Hints Used ({usedHints.length}):
                </p>
                <ul className="space-y-1">
                  {usedHints.map((hint, index) => (
                    <li
                      key={hint._id || index}
                      className="text-xs text-[#01ffdb]/80 flex items-center space-x-2"
                    >
                      <HelpCircle className="w-3 h-3" />
                      <span>Hint ID: {hint.hintId}</span>
                      {hint.usedBy && (
                        <span className="text-white">
                          by {hint.usedBy.username}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {challenge.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {challenge.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-[#01ffdb]/10 text-[#01ffdb]/70 text-xs rounded-md"
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
