import React from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, CheckCircle2, Award, HardHat, Sparkles, X, ChevronRight } from 'lucide-react';
import { createRipple } from '../common/MaterialRipple';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIssue: (issueId: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onSelectIssue,
}) => {
  const { notifications, markNotificationsAsRead, t } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm h-full flex flex-col shadow-elevation-8 border-l border-gray-200 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="bg-[#4285F4] text-white relative flex-shrink-0">
          <div className="google-accent-bar" />
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 text-[#FBBC05] flex items-center justify-center border border-white/30">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-medium text-sm text-white tracking-wide">{t.notifications}</h3>
                <p className="text-[11px] text-white/80">Updates on your reports & rewards</p>
              </div>
            </div>
            <button
              onClick={(e) => {
                createRipple(e);
                markNotificationsAsRead();
                onClose();
              }}
              className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors ripple-surface"
              aria-label="Close notifications"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-gray-100">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-[#5F6368]">
              <Bell className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              <p className="text-xs">No notifications yet.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={(e) => {
                  createRipple(e);
                  if (notif.issueId) {
                    onSelectIssue(notif.issueId);
                    onClose();
                  }
                }}
                className={`pt-2.5 first:pt-0 flex items-start space-x-3 p-2.5 rounded transition-colors ripple-surface ${
                  notif.issueId ? 'cursor-pointer hover:bg-gray-50' : ''
                } ${!notif.read ? 'bg-[#E8F0FE]/40' : ''}`}
              >
                {/* Icon */}
                <div
                  className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    notif.type === 'xp'
                      ? 'bg-[#FEF7E0] text-[#B06000]'
                      : notif.type === 'badge'
                      ? 'bg-[#E6F4EA] text-[#137333]'
                      : notif.type === 'worker'
                      ? 'bg-[#E8F0FE] text-[#1A73E8]'
                      : 'bg-[#F1F3F4] text-[#5F6368]'
                  }`}
                >
                  {notif.type === 'xp' ? (
                    <Sparkles className="w-4 h-4 text-[#FBBC05]" />
                  ) : notif.type === 'badge' ? (
                    <Award className="w-4 h-4 text-[#34A853]" />
                  ) : notif.type === 'worker' ? (
                    <HardHat className="w-4 h-4 text-[#4285F4]" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-[#34A853]" />
                  )}
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-medium text-[#202124] truncate">{notif.title}</h4>
                    <span className="text-[10px] text-[#5F6368]">{notif.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-[#5F6368] mt-0.5 leading-relaxed">
                    {notif.message}
                  </p>

                  {notif.issueId && (
                    <span className="inline-flex items-center text-[10px] font-medium text-[#1A73E8] mt-1 hover:underline uppercase tracking-wide">
                      {t.viewTracking} <ChevronRight className="w-3 h-3 ml-0.5" />
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Action Button */}
        <div className="p-3 bg-[#F8F9FA] border-t border-[#DADCE0]">
          <button
            onClick={(e) => {
              createRipple(e);
              markNotificationsAsRead();
              onClose();
            }}
            className="w-full py-2.5 bg-[#4285F4] hover:bg-[#1A73E8] text-white rounded text-xs font-medium uppercase tracking-wider transition-all shadow-elevation-1 ripple-surface min-h-touch"
          >
            Mark All as Read
          </button>
        </div>
      </div>
    </div>
  );
};
