/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Facility, ServiceCounter, Token, User } from '../types/queue';
import { queueStore } from '../services/storage';
import { Play, Check, SkipForward, Pause, UserCheck, AlertCircle, Clock, ShieldCheck, RefreshCw } from 'lucide-react';

interface StaffDashboardProps {
  currentUser: User;
  facilities: Facility[];
  tokens: Token[];
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  currentUser,
  facilities,
  tokens,
}) => {
  // Find counter assigned to staff or default to Counter A
  const assignedCounterId = currentUser.assignedCounterId || 'cnt-canteen-a';
  const [activeCounterId, setActiveCounterId] = useState<string>(assignedCounterId);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  // Timer tick for service duration
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Locate active counter and its facility
  let assignedCounter: ServiceCounter | undefined;
  let assignedFacility: Facility | undefined;

  for (const fac of facilities) {
    const found = fac.counters.find((c) => c.id === activeCounterId);
    if (found) {
      assignedCounter = found;
      assignedFacility = fac;
      break;
    }
  }

  // Fallback
  if (!assignedCounter || !assignedFacility) {
    assignedFacility = facilities[0];
    assignedCounter = assignedFacility.counters[0];
  }

  // Filter tokens for this counter
  const waitingTokens = tokens
    .filter(
      (t) => t.counterId === assignedCounter?.id && (t.status === 'WAITING' || t.status === 'CALLED')
    )
    .sort((a, b) => {
      // Prioritize PriorityQueue weights
      const weights = { EMERGENCY: 300, ACCESSIBLE: 200, FACULTY_REFERRAL: 100, NORMAL: 0 };
      const diff = (weights[b.priority] || 0) - (weights[a.priority] || 0);
      if (diff !== 0) return diff;
      return a.bookingTime - b.bookingTime;
    });

  const currentlyServingToken = tokens.find(
    (t) => t.id === assignedCounter?.currentlyServingTokenId
  );

  // Elapsed seconds of currently serving student
  let servingElapsedSeconds = 0;
  if (currentlyServingToken && assignedCounter.servingStartedAt) {
    servingElapsedSeconds = Math.max(0, Math.floor((now - assignedCounter.servingStartedAt) / 1000));
  }

  // Handlers
  const handleCallNext = () => {
    if (!assignedCounter) return;
    const res = queueStore.callNextToken(assignedCounter.id, currentUser.name);
    if (res.success && res.token) {
      setActionMessage(`Called token ${res.token.tokenNumber} to ${assignedCounter.name}.`);
    } else {
      setActionMessage(res.error || 'Failed to call token.');
    }
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleMarkServed = () => {
    if (!assignedCounter || !currentlyServingToken) return;
    const res = queueStore.markServed(assignedCounter.id, currentlyServingToken.id, currentUser.name);
    if (res.success) {
      setActionMessage(`Marked ${currentlyServingToken.tokenNumber} as completed.`);
    } else {
      setActionMessage(res.error || 'Failed to complete token.');
    }
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleSkip = () => {
    if (!assignedCounter || !currentlyServingToken) return;
    const res = queueStore.skipToken(assignedCounter.id, currentlyServingToken.id, currentUser.name);
    if (res.success) {
      setActionMessage(`Skipped absent token ${currentlyServingToken.tokenNumber}.`);
    }
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleTogglePause = () => {
    if (!assignedCounter) return;
    const res = queueStore.toggleCounterPause(assignedCounter.id, currentUser.name);
    setActionMessage(`Counter status set to ${res.newStatus}.`);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const isPaused = assignedCounter.status === 'PAUSED';

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar with Counter Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Staff Service Desk</span>
            <span>·</span>
            <span>{assignedFacility.name}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {assignedCounter.name}
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Active Staff: <strong className="text-slate-800">{currentUser.name}</strong> · Desk #{assignedCounter.counterNumber}
          </p>
        </div>

        {/* Counter Selection Switcher (Allows testing multiple counters) */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-medium">Switch Desk:</label>
          <select
            value={activeCounterId}
            onChange={(e) => setActiveCounterId(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            {facilities
              .flatMap((f) => f.counters.map((c) => ({ ...c, facilityName: f.name })))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.facilityName} — {c.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div className="p-3 bg-teal-50 border border-teal-200 text-teal-900 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-teal-600" />
            <span className="font-semibold">{actionMessage}</span>
          </div>
        </div>
      )}

      {/* Counter Controls & Currently Serving Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Control Card */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Active Service Station
                </span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase ${
                    assignedCounter.status === 'OPEN'
                      ? 'bg-emerald-100 text-emerald-800'
                      : assignedCounter.status === 'BUSY'
                      ? 'bg-blue-100 text-blue-800'
                      : assignedCounter.status === 'PAUSED'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {assignedCounter.status}
                </span>
              </div>

              <button
                onClick={handleTogglePause}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isPaused
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                }`}
              >
                <Pause className="w-3.5 h-3.5" />
                <span>{isPaused ? 'Resume Desk' : 'Pause Desk'}</span>
              </button>
            </div>

            {/* Currently Serving Display */}
            <div className="py-8 text-center">
              {currentlyServingToken ? (
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider">
                    Currently at Counter
                  </span>
                  <div className="text-5xl font-black font-mono tracking-tight text-slate-900">
                    {currentlyServingToken.tokenNumber}
                  </div>
                  <div className="text-sm font-semibold text-slate-800">
                    {currentlyServingToken.studentName} ({currentlyServingToken.studentRollNo})
                  </div>

                  {currentlyServingToken.priority !== 'NORMAL' && (
                    <div className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{currentlyServingToken.priority} Priority Tier</span>
                    </div>
                  )}

                  {/* Active Timer */}
                  <div className="pt-2 flex items-center justify-center gap-2 text-slate-500 font-mono text-sm">
                    <Clock className="w-4 h-4 text-teal-600 animate-pulse" />
                    <span>
                      Duration: {Math.floor(servingElapsedSeconds / 60)}m{' '}
                      {servingElapsedSeconds % 60}s
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-6 space-y-2">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">Counter is Currently Idle</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {waitingTokens.length > 0
                      ? `${waitingTokens.length} students waiting in queue. Press "Call Next Token" to begin.`
                      : 'No students waiting in queue. Counter is ready for incoming requests.'}
                  </p>
                </div>
              )}
            </div>
          </div>

            {/* Action Buttons Toolbar */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              disabled={isPaused || waitingTokens.length === 0}
              onClick={handleCallNext}
              className={`py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                isPaused || waitingTokens.length === 0
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-teal-700 hover:bg-teal-600 text-white'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Call Next Token</span>
            </button>

            <button
              disabled={!currentlyServingToken}
              onClick={handleMarkServed}
              className={`py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                !currentlyServingToken
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Mark Served (Done)</span>
            </button>

            <button
              disabled={!currentlyServingToken}
              onClick={handleSkip}
              className={`py-3 px-4 rounded-xl text-xs font-semibold transition-all border flex items-center justify-center gap-2 cursor-pointer ${
                !currentlyServingToken
                  ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                  : 'bg-white hover:bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              <SkipForward className="w-4 h-4" />
              <span>Skip / Absent</span>
            </button>
          </div>
        </div>

        {/* Right Col: Desk Performance Metrics Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            Desk Performance (Today)
          </h3>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-400">Total Students Served</p>
              <p className="text-3xl font-black font-mono tabular-nums text-slate-900 mt-0.5">
                {assignedCounter.totalServedToday}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Successful transactions</p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Average Service Velocity</p>
              <p className="text-3xl font-black font-mono tabular-nums text-teal-800 mt-0.5">
                {Math.round(assignedCounter.avgServiceDurationSeconds / 60)} <span className="text-sm font-normal text-slate-500">min/student</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Calculated via rolling exponential moving average
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Active Queue Depth</p>
              <p className="text-3xl font-black font-mono tabular-nums text-slate-900 mt-0.5">
                {waitingTokens.length}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Students currently waiting</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-100">
              <span className="font-semibold text-slate-800">Priority Engine:</span>
              <p className="mt-1 leading-relaxed">
                Tokens with Emergency or Accessibility passes automatically jump to the head of the Java PriorityQueue.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Waiting Students Queue Table (FIFO + Priority Queue) */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Waiting Line ({waitingTokens.length})</h3>
            <p className="text-xs text-slate-500">
              Ordered according to Java PriorityQueue comparator (Priority Tier + FIFO Arrival)
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Next in line: {waitingTokens[0]?.tokenNumber || 'None'}
          </span>
        </div>

        {waitingTokens.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No students waiting in queue for this counter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Token #</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Priority Tier</th>
                  <th className="py-3 px-4">Booked At</th>
                  <th className="py-3 px-4">Est. Wait</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {waitingTokens.map((t, idx) => (
                  <tr
                    key={t.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      idx === 0 ? 'bg-teal-50/40 font-medium' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono text-slate-400">
                      #{idx + 1}
                      {idx === 0 && <span className="ml-1 text-teal-700 font-bold">(Next)</span>}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {t.tokenNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-800">
                      {t.studentName}
                      <span className="text-slate-400 ml-1.5 font-mono">({t.studentRollNo})</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                          t.priority === 'EMERGENCY'
                            ? 'bg-rose-100 text-rose-800 font-bold'
                            : t.priority === 'ACCESSIBLE'
                            ? 'bg-amber-100 text-amber-800 font-bold'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {new Date(t.bookingTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-mono">
                      ~{(idx + 1) * Math.round(assignedCounter.avgServiceDurationSeconds / 60)} min
                    </td>
                    <td className="py-3 px-4 text-right">
                      {idx === 0 && !currentlyServingToken && (
                        <button
                          onClick={handleCallNext}
                          className="px-2.5 py-1 bg-teal-700 text-white rounded font-bold hover:bg-teal-600 transition-colors cursor-pointer"
                        >
                          Call
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
