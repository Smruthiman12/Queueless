/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, UserRole } from '../types/queue';
import { Bell, Smartphone, Monitor, RefreshCw, ChevronDown, Check } from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  onSwitchRole: (role: UserRole) => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  unreadNotificationCount: number;
  onOpenNotifications: () => void;
  isMobilePreview: boolean;
  onToggleMobilePreview: () => void;
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSwitchRole,
  activeTab,
  onSelectTab,
  unreadNotificationCount,
  onOpenNotifications,
  isMobilePreview,
  onToggleMobilePreview,
  onResetData,
}) => {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const getNavLinks = () => {
    if (currentUser.role === 'student') {
      return [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'compare', label: 'Smart Counters' },
        { id: 'my-token', label: 'My Token' },
        { id: 'dsa-lab', label: 'DSA Lab' },
        { id: 'simulation', label: '3-Counter Simulation' },
        { id: 'architecture', label: 'System Architecture' },
      ];
    }
    if (currentUser.role === 'staff') {
      return [
        { id: 'staff-dashboard', label: 'Counter Desk' },
        { id: 'live-queue', label: 'Queue Operations' },
        { id: 'dsa-lab', label: 'DSA Lab' },
        { id: 'simulation', label: 'Simulation' },
        { id: 'architecture', label: 'System Architecture' },
      ];
    }
    // Admin
    return [
      { id: 'admin-analytics', label: 'Overview & Analytics' },
      { id: 'admin-facilities', label: 'Facilities & Counters' },
      { id: 'dsa-lab', label: 'DSA Lab' },
      { id: 'simulation', label: '3-Counter Simulation' },
      { id: 'architecture', label: 'System Architecture' },
    ];
  };

  const navLinks = getNavLinks();

  const handleRoleSelect = (role: UserRole) => {
    onSwitchRole(role);
    setRoleDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-8">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onSelectTab(currentUser.role === 'staff' ? 'staff-dashboard' : currentUser.role === 'admin' ? 'admin-analytics' : 'dashboard')}
              className="flex items-center gap-2.5 text-left focus:outline-none"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                Q
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
                  QueueLess
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs font-normal text-slate-400">
                  Less Waiting. More Living.
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 overflow-x-auto py-2">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => onSelectTab(link.id)}
                className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
                  activeTab === link.id
                    ? 'text-slate-900 font-semibold border-b-2 border-slate-900 -mb-0.5'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: Actions & Role Control */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Mobile View Toggle */}
            <button
              onClick={onToggleMobilePreview}
              title={isMobilePreview ? 'Switch to Desktop Layout' : 'Preview Mobile App Screen'}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              {isMobilePreview ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
            </button>

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-teal-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </span>
              )}
            </button>

            {/* Demo Reset Button */}
            <button
              onClick={onResetData}
              title="Reset Demo State"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">Reset Demo</span>
            </button>

            {/* Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span className="capitalize font-semibold text-teal-800">{currentUser.role}</span>
                <span className="hidden sm:inline text-slate-600">({currentUser.name.split(' ')[0]})</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-50">
                  <div className="px-3 py-1.5 border-b border-slate-100">
                    <p className="text-xs text-slate-500 font-medium">Switch Active Role</p>
                  </div>
                  <button
                    onClick={() => handleRoleSelect('student')}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-slate-50 cursor-pointer"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">Student Portal</p>
                      <p className="text-[11px] text-slate-500">Alex Rivera (ID: 2024CS108)</p>
                    </div>
                    {currentUser.role === 'student' && <Check className="w-3.5 h-3.5 text-teal-600" />}
                  </button>

                  <button
                    onClick={() => handleRoleSelect('staff')}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-slate-50 cursor-pointer"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">Staff Counter Desk</p>
                      <p className="text-[11px] text-slate-500">Sarah Jenkins (Counter A)</p>
                    </div>
                    {currentUser.role === 'staff' && <Check className="w-3.5 h-3.5 text-teal-600" />}
                  </button>

                  <button
                    onClick={() => handleRoleSelect('admin')}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-slate-50 cursor-pointer"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">Administrator Console</p>
                      <p className="text-[11px] text-slate-500">Dr. Robert Chen (Dean)</p>
                    </div>
                    {currentUser.role === 'admin' && <Check className="w-3.5 h-3.5 text-teal-600" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
