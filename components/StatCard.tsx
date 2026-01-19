
import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-6 hover:shadow-md transition-all duration-300 group">
      <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-1">{title}</p>
        <p className="text-xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;
