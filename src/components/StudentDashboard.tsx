/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Facility, Token, User } from '../types/queue';
import { Clock, Users, ArrowRight, CheckCircle2, AlertCircle, Compass, History } from 'lucide-react';

interface StudentDashboardProps {
  currentUser: User;
  facilities: Facility[];
  tokens: Token[];
  activeToken?: Token;
  onSelectFacility: (facilityId: string) => void;
  onOpenBooking: (facilityId: string, counterId?: string) => void;
  onViewToken: (token: Token) => void;
  onNavigateToTab: (tab: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentUser,
  facilities,
  tokens,
  activeToken,
  onSelectFacility,
  onOpenBooking,
  onViewToken,
  onNavigateToTab,
}) => {
  // Aggregate stats
  const totalWaitingAcrossCampus = tokens.filter(
    (t) => t.status === 'WAITING' || t.status === 'CALLED'
  ).length;

  const myHistoryTokens = tokens
    .filter((t) => t.studentId === currentUser.id && (t.status === 'COMPLETED' || t.status === 'CANCELLED' || t.status === 'SKIPPED'))
    .sort((a, b) => b.bookingTime - a.bookingTime);

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Banner with Campus Image and Headline */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 text-white shadow-sm">
        <img
          src="/src/assets/images/hero_campus_life_1792642223548.jpg"
          alt="Modern campus commons"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-luminosity"
        />
        <div className="relative z-10 p-6 sm:p-8 md:p-10 max-w-3xl">
          <div className="flex items-center gap-2 text-xs text-teal-400 font-semibold uppercase tracking-wider mb-2">
            <span>Campus Queue Management</span>
            <span>·</span>
            <span>Real-Time Optimization</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white mb-3 text-balance">
            Less Waiting. More Living.
          </h1>
          <p className="text-sm sm:text-base text-slate-300 mb-6 leading-relaxed">
            Welcome back, <span className="font-semibold text-white">{currentUser.name}</span> ({currentUser.studentId}).
            Skip the physical rush—track live queues at the canteen, library, administrative office, and fee counters from your phone or laptop.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateToTab('compare')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Smart Counter Comparison</span>
            </button>
            <button
              onClick={() => onNavigateToTab('simulation')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg backdrop-blur-sm transition-colors cursor-pointer"
            >
              <span>3-Counter Speed Simulation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Token Card Spotlight (If student has an active booking) */}
      {activeToken && (
        <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-lg font-mono tabular-nums shrink-0 shadow-sm">
                {activeToken.tokenNumber.split('-')[1] || activeToken.tokenNumber}
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs text-teal-800 font-medium mb-1">
                  <span className="font-semibold">{activeToken.tokenNumber}</span>
                  <span>·</span>
                  <span>
                    Status: <strong className="uppercase">{activeToken.status}</strong>
                  </span>
                  {activeToken.priority !== 'NORMAL' && (
                    <>
                      <span>·</span>
                      <span className="text-amber-700 font-semibold">{activeToken.priority} Priority</span>
                    </>
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {facilities.find((f) => f.id === activeToken.facilityId)?.name || 'Campus Facility'}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Assigned Counter:{' '}
                  {facilities
                    .flatMap((f) => f.counters)
                    .find((c) => c.id === activeToken.counterId)?.name || 'Counter'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 sm:border-l sm:border-teal-200 sm:pl-6">
              <div className="text-left sm:text-right">
                <p className="text-xs text-slate-500">People Ahead</p>
                <p className="text-xl font-bold font-mono tabular-nums text-slate-900">
                  {Math.max(0, activeToken.positionInQueue - 1)}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs text-slate-500">Est. Wait</p>
                <p className="text-xl font-bold font-mono tabular-nums text-teal-800">
                  ~{activeToken.estimatedWaitMinutes} min
                </p>
              </div>
              <button
                onClick={() => onViewToken(activeToken)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
              >
                Live Tracker
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Campus Services Active</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {facilities.filter((f) => f.isActive).length}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Operational campus facilities</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Active Service Counters</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {facilities.flatMap((f) => f.counters).filter((c) => c.status === 'OPEN' || c.status === 'BUSY').length}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Staffed & taking tickets</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Students in Queues</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-teal-700 mt-1">
            {totalWaitingAcrossCampus}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Across all college counters</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Avg Service Time</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            3.6 <span className="text-sm font-normal text-slate-500">min</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Optimized by DSA load balancing</p>
        </div>
      </div>

      {/* Service Directory Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Campus Facilities & Live Queues</h2>
            <p className="text-xs text-slate-500">
              Select a facility to compare counters or book a digital token directly.
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('compare')}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 transition-colors flex items-center gap-1 cursor-pointer"
          >
            Compare All Counters <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {facilities.map((facility) => {
            const activeCounters = facility.counters.filter(
              (c) => c.status === 'OPEN' || c.status === 'BUSY'
            );
            const facilityTokens = tokens.filter(
              (t) => t.facilityId === facility.id && (t.status === 'WAITING' || t.status === 'CALLED')
            );
            const totalWaiting = facilityTokens.length;

            // Compute approximate wait using fastest active counter
            let minWaitMins = 0;
            if (activeCounters.length > 0) {
              const fastestSpeed = Math.min(
                ...activeCounters.map((c) => c.avgServiceDurationSeconds || 240)
              );
              minWaitMins = Math.ceil(
                (Math.floor(totalWaiting / activeCounters.length) * fastestSpeed) / 60
              );
            }

            return (
              <div
                key={facility.id}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                {facility.imageUrl && (
                  <div className="relative h-36 w-full overflow-hidden bg-slate-100">
                    <img
                      src={facility.imageUrl}
                      alt={facility.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                    <div className="absolute top-2.5 right-2.5 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-medium px-2 py-0.5 rounded">
                      {facility.operatingHours}
                    </div>
                  </div>
                )}

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span className="font-semibold text-teal-700 uppercase tracking-wider text-[10px]">
                        {facility.category}
                      </span>
                      <span>{facility.location}</span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{facility.name}</h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {facility.description}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-[10px] text-slate-400">Counters</p>
                        <p className="text-sm font-bold font-mono tabular-nums text-slate-800">
                          {activeCounters.length} / {facility.counters.length}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Waiting</p>
                        <p className="text-sm font-bold font-mono tabular-nums text-slate-800">
                          {totalWaiting}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Est. Wait</p>
                        <p
                          className={`text-sm font-bold font-mono tabular-nums ${
                            minWaitMins <= 5
                              ? 'text-emerald-700'
                              : minWaitMins <= 12
                              ? 'text-amber-700'
                              : 'text-rose-700'
                          }`}
                        >
                          ~{minWaitMins} min
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => onSelectFacility(facility.id)}
                      className="flex-1 py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-center cursor-pointer"
                    >
                      Compare Counters
                    </button>
                    <button
                      onClick={() => onOpenBooking(facility.id)}
                      className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors text-center cursor-pointer shadow-sm"
                    >
                      Book Token
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Tokens & History */}
      {myHistoryTokens.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-900">Your Recent Tokens</h3>
            </div>
            <span className="text-xs text-slate-400">{myHistoryTokens.length} recorded</span>
          </div>

          <div className="divide-y divide-slate-100">
            {myHistoryTokens.slice(0, 3).map((token) => (
              <div key={token.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-semibold text-slate-900">{token.tokenNumber}</span>
                  <span className="text-slate-500">
                    {facilities.find((f) => f.id === token.facilityId)?.name || 'Facility'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`font-medium ${
                      token.status === 'COMPLETED'
                        ? 'text-emerald-700'
                        : token.status === 'CANCELLED'
                        ? 'text-slate-500'
                        : 'text-amber-700'
                    }`}
                  >
                    {token.status}
                  </span>
                  <span className="text-slate-400">
                    {new Date(token.bookingTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
