import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, Clock, AlertTriangle, ShieldAlert, Zap } from 'lucide-react';
import { computeSlaStatus } from '../../config/slaConfig';

export const AnalyticsOverview: React.FC = () => {
  const { issues } = useApp();

  const nowMs = Date.now();
  const resolvedCount = issues.filter((i) => i.status === 'Resolved').length;
  const resolvedWithinSlaCount = issues.filter((i) => i.status === 'Resolved' && i.wasResolvedWithinSLA !== false).length;
  const slaMetRate = resolvedCount > 0 ? Math.round((resolvedWithinSlaCount / resolvedCount) * 100) : 100;

  const dueSoonCount = issues.filter((i) => {
    if (i.status === 'Resolved') return false;
    const st = computeSlaStatus(i, nowMs);
    return st === 'DUE_SOON' || st === 'URGENT';
  }).length;

  const escalatedCount = issues.filter((i) => {
    if (i.status === 'Resolved') return false;
    const st = computeSlaStatus(i, nowMs);
    return st === 'ESCALATED' || st === 'OVERDUE';
  }).length;

  const activeCount = issues.filter((i) => i.status !== 'Resolved').length;

  const cards = [
    {
      title: 'Active Complaints',
      value: `${activeCount}`,
      subtext: `${issues.length} total registered`,
      icon: <Clock className="w-5 h-5 text-[#1A73E8]" />,
      bg: 'bg-white border-gray-200',
      textColor: 'text-[#1A73E8]',
    },
    {
      title: 'Complaints Due Soon',
      value: `${dueSoonCount}`,
      subtext: '< 24h SLA remaining',
      icon: <Zap className="w-5 h-5 text-[#B06000]" />,
      bg: 'bg-white border-gray-200',
      textColor: 'text-[#B06000]',
    },
    {
      title: 'Auto Escalated to HQ',
      value: `${escalatedCount}`,
      subtext: 'SLA deadline exceeded',
      icon: <ShieldAlert className="w-5 h-5 text-[#C5221F]" />,
      bg: 'bg-white border-gray-200',
      textColor: 'text-[#C5221F]',
    },
    {
      title: 'Issues Resolved',
      value: `${resolvedCount}`,
      subtext: 'Field team verified',
      icon: <CheckCircle2 className="w-5 h-5 text-[#137333]" />,
      bg: 'bg-white border-gray-200',
      textColor: 'text-[#137333]',
    },
    {
      title: 'SLA Compliance Rate',
      value: `${slaMetRate}%`,
      subtext: `${resolvedWithinSlaCount}/${resolvedCount || 1} met SLA`,
      icon: <CheckCircle2 className="w-5 h-5 text-[#137333]" />,
      bg: 'bg-white border-gray-200',
      textColor: 'text-[#137333]',
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
