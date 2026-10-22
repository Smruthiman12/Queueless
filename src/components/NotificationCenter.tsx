/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { InAppNotification } from '../types/queue';
import { queueStore } from '../services/storage';
import { X, Bell, CheckCheck, Clock, Volume2, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  notifications: InAppNotification[];
  onSelectTokenNotification?: (tokenId: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  userId,
  notifications,
  onSelectTokenNotification,
}) => {
  if (!isOpen) return null;

  const handleMarkAllRead = () => {
    queueStore.markAllNotificationsRead(userId);
  };

  const handleNotificationClick = (n: InAppNotification) => {
    queueStore.markNotificationAsRead(n.id);
    if (n.tokenId && onSelectTokenNotification) {
      onSelectTokenNotification(n.tokenId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-slate-700" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Notifications</h2>
              <p className="text-xs text-slate-500">Live queue alerts & service updates</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-teal-700 hover:text-teal-800 font-semibold cursor-pointer"
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="p-5 flex-1 overflow-y-auto space-y-3">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No notifications yet.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`p-3.5 rounded-xl border text-xs transition-colors cursor-pointer ${
                  !n.read
                    ? 'bg-teal-50/50 border-teal-200'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    {n.type === 'turn_now' ? (
                      <Volume2 className="w-4 h-4 text-teal-600 shrink-0" />
                    ) : n.type === 'pause' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    )}
                    <h4 className="font-bold text-slate-900">{n.title}</h4>
                  </div>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0 mt-1" />
                  )}
                </div>
                <p className="text-slate-600 leading-relaxed">{n.message}</p>
                <div className="mt-2 text-[10px] text-slate-400 font-mono">
                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 text-center text-xs text-slate-400 font-mono">
          Audio alert enabled for turn calls
        </div>
      </div>
    </div>
  );
};
