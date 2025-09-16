import React from 'react';

export default function StatCard({ title, value, icon: Icon, trend, trendValue }) {
  return (
    <div className="bg-black/50 rounded-xl border border-[#00ffff]/25 p-6 hover:border-[#00ffff]/40 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[#00ffff]/60 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        <Icon className="w-8 h-8 text-[#00ffff]/50" />
      </div>
      
      {/* {trend && (
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${trend === 'up' ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className={`text-sm ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
            {trendValue}
          </span>
        </div>
      )} */}
    </div>
  );
}