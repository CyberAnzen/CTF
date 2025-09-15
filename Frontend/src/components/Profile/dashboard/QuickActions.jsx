import React from 'react';
import { Users, BarChart3, Activity, TrendingUp, Flag, Target, Award, HelpCircle } from 'lucide-react';

export default function QuickActions() {
  const actions = [
    { icon: Flag, label: 'Submit Flag', color: 'hover:bg-green-500/20' },
    { icon: HelpCircle, label: 'Get Hint', color: 'hover:bg-blue-500/20' },
    { icon: Target, label: 'View Challenges', color: 'hover:bg-[#00ffff]/20' },
    { icon: Award, label: 'Leaderboard', color: 'hover:bg-yellow-500/20' },
    { icon: BarChart3, label: 'Analytics', color: 'hover:bg-purple-500/20' },
    { icon: Activity, label: 'System Status', color: 'hover:bg-red-500/20' }
  ];

  return (
    <div className="bg-black/50 rounded-xl border border-[#00ffff]/25 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[#00ffff]">Quick Actions</h2>
        <TrendingUp className="w-6 h-6 text-[#00ffff]/70" />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action, index) => (
          <button 
            key={index}
            className={`p-4 bg-[#00ffff]/10 rounded-lg transition-all duration-300 ${action.color} group`}
          >
            <action.icon className="w-6 h-6 text-[#00ffff] mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm text-white">{action.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
}