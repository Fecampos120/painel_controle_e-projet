
import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-6 hover:shadow-md transition-all duration-300 group">
      <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
        {icon}
      </div>
      <div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <p className="text-2xl font-black text-slate-800">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;
