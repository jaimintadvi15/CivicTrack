import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, Clock, AlertTriangle, TrendingUp, ShieldCheck } from 'lucide-react';

export const AnalyticsOverview: React.FC = () => {
  const { issues } = useApp();

  const resolvedCount = issues.filter((i) => i.status === 'Resolved').length;
  const criticalCount = issues.filter((i) => i.severity === 'Critical' && i.status !== 'Resolved').length;

  // Calculate top problem areas / wards
  const wardMap: Record<string, number> = {};
  issues.forEach((i) => {
    wardMap[i.location.ward] = (wardMap[i.location.ward] || 0) + 1;
  });
  const topWard = Object.entries(wardMap).sort((a, b) => b[1] - a[1])[0] || ['Indiranagar', 0];

  const cards = [
    {
      title: 'Issues Resolved',
      value: `${resolvedCount}`,
      subtext: '+12% vs last week',
      icon: <CheckCircle2 className="w-5 h-5 text-mat-secondary" />,
      bg: 'bg-white border-gray-200',
      textColor: 'text-mat-secondary',
    },
    {
      title: 'Avg Resolution Time',
      value: '4.2 hrs',
      subtext: 'Target SLA: < 6.0 hrs',
      icon: <Clock className="w-5 h-5 text-mat-low" />,
      bg: 'bg-white border-gray-200',
      textColor: 'text-mat-low',
    },
    {
      title: 'Critical Hazards',
      value: `${criticalCount}`,
      subtext: 'Immediate action required',
      icon: <AlertTriangle className="w-5 h-5 text-mat-critical" />,
      bg: 'bg-white border-gray-200',
      textColor: 'text-mat-critical',
    },
    {
      title: 'Top Problem Ward',
      value: topWard[0].split('-')[1]?.trim() || topWard[0],
      subtext: `${topWard[1]} active complaints`,
      icon: <TrendingUp className="w-5 h-5 text-mat-high" />,
      bg: 'bg-white border-gray-200',
      textColor: 'text-mat-high',
    },
    {
      title: 'Citizen Satisfaction',
      value: '94.8%',
      subtext: 'Based on 420 ratings',
      icon: <ShieldCheck className="w-5 h-5 text-mat-secondary" />,
      bg: 'bg-white border-gray-200',
      textColor: 'text-mat-secondary',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 w-full min-w-0 pt-1">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="relative p-4 sm:p-5 rounded-xl border border-[#DADCE0] bg-white shadow-elevation-1 hover:shadow-elevation-2 transition-all flex flex-col justify-between overflow-visible min-w-0"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-[11px] sm:text-xs font-medium text-[#5F6368] uppercase tracking-wider leading-snug">
              {card.title}
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#F8F9FA] border border-[#DADCE0] flex items-center justify-center shrink-0 shadow-xs">
              {card.icon}
            </div>
          </div>
          <div className="mt-1">
            <h3 className={`text-xl sm:text-2xl font-bold tracking-tight ${card.textColor}`}>
              {card.value}
            </h3>
            <p className="text-[11px] text-[#5F6368] font-normal mt-0.5 truncate">
              {card.subtext}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
