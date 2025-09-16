import React from 'react';
import { Activity, CheckCircle2, Flag, HelpCircle, Clock } from 'lucide-react';

export default function RecentActivity({ challenges }) {
  // Generate recent activities from challenges
  const activities = challenges
    .filter(challenge => challenge.Flag_Submitted || challenge.unlockedHints > 0)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 6)
    .map(challenge => {
      if (challenge.Flag_Submitted) {
        return {
          type: 'flag',
          icon: CheckCircle2,
          color: 'text-green-400',
          message: `Completed "${challenge.title}" Challenge`,
          time: challenge.completionTime || challenge.updatedAt
        };
      } else if (challenge.unlockedHints > 0) {
        return {
          type: 'hint',
          icon: HelpCircle,
          color: 'text-blue-400',
          message: `Hint used for "${challenge.title}"`,
          time: challenge.updatedAt
        };
      }
    })
    .filter(Boolean);

  return (
    <div className="bg-black/50 rounded-xl border border-[#00ffff]/25 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[#00ffff]">Recent Activity</h2>
        <Activity className="w-6 h-6 text-[#00ffff]/70" />
      </div>
      
      <div className="space-y-4">
        {activities.length > 0 ? activities.map((activity, index) => (
          <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-black/30 border border-[#00ffff]/10">
            <activity.icon className={`w-5 h-5 ${activity.color} mt-0.5 flex-shrink-0`} />
            <div className="flex-1">
              <p className="text-[#00ffff]/70 text-sm">{activity.message}</p>
              <div className="flex items-center space-x-1 mt-1">
                <Clock className="w-3 h-3 text-[#00ffff]/40" />
                <span className="text-[#00ffff]/40 text-xs">
                  {new Date(activity.time).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )) : (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-[#00ffff]/30 mx-auto mb-3" />
            <p className="text-[#00ffff]/50">No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
}