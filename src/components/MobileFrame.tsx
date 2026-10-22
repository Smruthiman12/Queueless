/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Home, Compass, Ticket, Bell, User as UserIcon, X } from 'lucide-react';
import { Token } from '../types/queue';

interface MobileFrameProps {
  children: React.ReactNode;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onCloseMobile: () => void;
  activeToken?: Token;
  unreadCount: number;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({
  children,
  activeTab,
  onSelectTab,
  onCloseMobile,
  activeToken,
  unreadCount,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Mobile Device Mockup */}
      <div className="relative w-full max-w-[400px] h-[840px] max-h-[96vh] bg-slate-900 rounded-[48px] p-3 shadow-2xl border-4 border-slate-750 flex flex-col justify-between overflow-hidden">
        {/* Speaker & Dynamic Island / Camera Notch */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-50 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-800 ml-auto mr-3" />
        </div>

        {/* Exit Mobile Preview Button on Top Left */}
        <button
          onClick={onCloseMobile}
          className="absolute top-5 right-5 z-50 p-1 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors cursor-pointer"
          title="Exit Mobile Preview"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Screen Bezel & Container */}
        <div className="w-full h-full bg-slate-50 rounded-[38px] flex flex-col justify-between overflow-hidden pt-7 relative">
          {/* Native-style Status Bar */}
          <div className="px-6 py-1 flex items-center justify-between text-[11px] font-semibold text-slate-800 select-none">
            <span>09:41</span>
            <div className="flex items-center gap-1.5">
              <span>5G</span>
              <div className="w-4 h-2.5 border border-slate-700 rounded-xs p-0.5 flex items-center">
                <div className="w-full h-full bg-slate-800 rounded-2xs" />
              </div>
            </div>
          </div>

          {/* Scrollable Mobile Viewport */}
          <div className="flex-1 overflow-y-auto px-4 py-2">
            {children}
          </div>

          {/* Student Mobile Navigation Bar (Home | Services | My Token | Notifications | Profile) */}
          <div className="bg-white border-t border-slate-200 px-3 py-2 flex items-center justify-around z-40 select-none">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors cursor-pointer ${
                activeTab === 'dashboard' ? 'text-teal-700 font-bold' : 'text-slate-500'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>

            <button
              onClick={() => onSelectTab('compare')}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors cursor-pointer ${
                activeTab === 'compare' ? 'text-teal-700 font-bold' : 'text-slate-500'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Services</span>
            </button>

            <button
              onClick={() => onSelectTab('my-token')}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors cursor-pointer relative ${
                activeTab === 'my-token' ? 'text-teal-700 font-bold' : 'text-slate-500'
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>My Token</span>
              {activeToken && (
                <span className="absolute -top-1 right-2 w-2 h-2 rounded-full bg-teal-600" />
              )}
            </button>

            <button
              onClick={() => onSelectTab('dsa-lab')}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors cursor-pointer ${
                activeTab === 'dsa-lab' ? 'text-teal-700 font-bold' : 'text-slate-500'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>DSA Lab</span>
            </button>

            <button
              onClick={() => onSelectTab('architecture')}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors cursor-pointer ${
                activeTab === 'architecture' ? 'text-teal-700 font-bold' : 'text-slate-500'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>Specs</span>
            </button>
          </div>

          {/* Home Indicator Bar */}
          <div className="w-32 h-1 bg-slate-300 rounded-full mx-auto my-1.5" />
        </div>
      </div>
    </div>
  );
};
