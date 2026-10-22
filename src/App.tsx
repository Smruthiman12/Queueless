/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { StudentDashboard } from './components/StudentDashboard';
import { CounterComparison } from './components/CounterComparison';
import { TokenBookingModal } from './components/TokenBookingModal';
import { LiveQueueTracker } from './components/LiveQueueTracker';
import { StaffDashboard } from './components/StaffDashboard';
import { AdminAnalytics } from './components/AdminAnalytics';
import { DsaLab } from './components/DsaLab';
import { SimulationMode } from './components/SimulationMode';
import { ArchitectureDocs } from './components/ArchitectureDocs';
import { NotificationCenter } from './components/NotificationCenter';
import { MobileFrame } from './components/MobileFrame';
import { queueStore } from './services/storage';
import { Facility, Token, User, UserRole } from './types/queue';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>(queueStore.getCurrentUser());
  const [facilities, setFacilities] = useState<Facility[]>(queueStore.getFacilities());
  const [tokens, setTokens] = useState<Token[]>(queueStore.getTokens());
  const [notifications, setNotifications] = useState(queueStore.getNotifications());
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Booking Modal
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingFacilityId, setBookingFacilityId] = useState<string | undefined>(undefined);
  const [bookingCounterId, setBookingCounterId] = useState<string | undefined>(undefined);

  // Notification Drawer
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Mobile Device Frame
  const [isMobilePreview, setIsMobilePreview] = useState(false);

  // Selected facility in comparison view
  const [comparisonFacilityId, setComparisonFacilityId] = useState<string | undefined>(undefined);

  // Tracked Token for live view
  const [trackedTokenId, setTrackedTokenId] = useState<string | null>(null);

  // Subscribe to storage changes
  useEffect(() => {
    const unsubscribe = queueStore.subscribe(() => {
      setCurrentUser(queueStore.getCurrentUser());
      setFacilities(queueStore.getFacilities());
      setTokens(queueStore.getTokens());
      setNotifications(queueStore.getNotifications());
    });
    return unsubscribe;
  }, []);

  const unreadCount = notifications.filter(
    (n) => n.userId === currentUser.id && !n.read
  ).length;

  const activeStudentToken = queueStore.getActiveTokenForStudent(currentUser.id);

  // Role switching
  const handleSwitchRole = (role: UserRole) => {
    const updatedUser = queueStore.switchUserRole(role);
    setCurrentUser(updatedUser);
    if (role === 'student') {
      setActiveTab('dashboard');
    } else if (role === 'staff') {
      setActiveTab('staff-dashboard');
    } else {
      setActiveTab('admin-analytics');
    }
  };

  const handleOpenBooking = (facilityId: string, counterId?: string) => {
    setBookingFacilityId(facilityId);
    setBookingCounterId(counterId);
    setBookingModalOpen(true);
  };

  const handleSelectFacilityToCompare = (facilityId: string) => {
    setComparisonFacilityId(facilityId);
    setActiveTab('compare');
  };

  const handleBookingSuccess = (token: Token) => {
    setTrackedTokenId(token.id);
    setActiveTab('my-token');
  };

  const handleResetData = () => {
    if (window.confirm('Reset all demo queues, active tokens, and counter records to clean starting state?')) {
      queueStore.resetToDefaults();
      setActiveTab(currentUser.role === 'staff' ? 'staff-dashboard' : currentUser.role === 'admin' ? 'admin-analytics' : 'dashboard');
    }
  };

  // Determine current active or tracked token
  const currentViewToken =
    (trackedTokenId && tokens.find((t) => t.id === trackedTokenId)) ||
    activeStudentToken ||
    tokens.find((t) => t.studentId === currentUser.id);

  // Active facility & counter for live queue tracker
  const trackerFacility =
    (currentViewToken && facilities.find((f) => f.id === currentViewToken.facilityId)) ||
    facilities[0];

  const trackerCounter =
    (currentViewToken &&
      trackerFacility?.counters.find((c) => c.id === currentViewToken.counterId)) ||
    trackerFacility?.counters[0];

  // Render view content
  const renderContent = () => {
    // 1. My Token / Live Queue Tracker
    if (activeTab === 'my-token') {
      if (currentViewToken && trackerFacility && trackerCounter) {
        return (
          <LiveQueueTracker
            token={currentViewToken}
            facility={trackerFacility}
            counter={trackerCounter}
            allTokens={tokens}
            currentUser={currentUser}
            onBack={() => setActiveTab('dashboard')}
            onBookAnother={() => {
              setTrackedTokenId(null);
              handleOpenBooking(facilities[0].id);
            }}
          />
        );
      }
      return (
        <div className="max-w-xl mx-auto py-16 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 font-mono text-xl">
            #
          </div>
          <h2 className="text-xl font-bold text-slate-900">No Active Token Right Now</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            You don't currently have an active queue reservation. Pick a campus facility to reserve your spot!
          </p>
          <button
            onClick={() => handleOpenBooking(facilities[0].id)}
            className="px-4 py-2.5 bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            Book Digital Token
          </button>
        </div>
      );
    }

    // 2. Smart Counter Comparison
    if (activeTab === 'compare') {
      return (
        <CounterComparison
          facilities={facilities}
          tokens={tokens}
          currentUser={currentUser}
          selectedFacilityId={comparisonFacilityId}
          onSelectFacility={setComparisonFacilityId}
          onBookTokenAtCounter={(facilityId, counterId) =>
            handleOpenBooking(facilityId, counterId)
          }
        />
      );
    }

    // 3. Staff Counter Desk & Queue Operations
    if (activeTab === 'staff-dashboard' || activeTab === 'live-queue') {
      return (
        <StaffDashboard
          currentUser={currentUser}
          facilities={facilities}
          tokens={tokens}
        />
      );
    }

    // 4. Admin Analytics & Facility Management
    if (activeTab === 'admin-analytics' || activeTab === 'admin-facilities') {
      return (
        <AdminAnalytics
          facilities={facilities}
          tokens={tokens}
          currentUser={currentUser}
        />
      );
    }

    // 5. DSA Lab
    if (activeTab === 'dsa-lab') {
      return <DsaLab />;
    }

    // 6. 3-Counter Simulation
    if (activeTab === 'simulation') {
      return <SimulationMode />;
    }

    // 7. System Architecture & Specs
    if (activeTab === 'architecture') {
      return <ArchitectureDocs />;
    }

    // Default: Student Dashboard
    return (
      <StudentDashboard
        currentUser={currentUser}
        facilities={facilities}
        tokens={tokens}
        activeToken={activeStudentToken}
        onSelectFacility={handleSelectFacilityToCompare}
        onOpenBooking={(facilityId, counterId) => handleOpenBooking(facilityId, counterId)}
        onViewToken={(tok) => {
          setTrackedTokenId(tok.id);
          setActiveTab('my-token');
        }}
        onNavigateToTab={setActiveTab}
      />
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onSwitchRole={handleSwitchRole}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        unreadNotificationCount={unreadCount}
        onOpenNotifications={() => setNotificationsOpen(true)}
        isMobilePreview={isMobilePreview}
        onToggleMobilePreview={() => setIsMobilePreview(!isMobilePreview)}
        onResetData={handleResetData}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderContent()}
      </main>

      {/* Booking Modal */}
      <TokenBookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        currentUser={currentUser}
        facilities={facilities}
        tokens={tokens}
        initialFacilityId={bookingFacilityId}
        initialCounterId={bookingCounterId}
        onBookingSuccess={handleBookingSuccess}
      />

      {/* Notification Center */}
      <NotificationCenter
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        userId={currentUser.id}
        notifications={notifications.filter((n) => n.userId === currentUser.id)}
        onSelectTokenNotification={(tokId) => {
          setTrackedTokenId(tokId);
          setActiveTab('my-token');
        }}
      />

      {/* Mobile Frame Simulation (if toggled) */}
      {isMobilePreview && (
        <MobileFrame
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onCloseMobile={() => setIsMobilePreview(false)}
          activeToken={activeStudentToken}
          unreadCount={unreadCount}
        >
          {renderContent()}
        </MobileFrame>
      )}

      {/* Clean Anti-Slop Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">QueueLess</span>
            <span>·</span>
            <span>Smart Queue and Waiting-Time Optimizer</span>
            <span>·</span>
            <span className="text-teal-700 font-medium">“Less Waiting. More Living.”</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setActiveTab('dsa-lab')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              DSA Analysis
            </button>
            <button
              onClick={() => setActiveTab('simulation')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              3-Counter Simulator
            </button>
            <button
              onClick={() => setActiveTab('architecture')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Architecture & Schemas
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
