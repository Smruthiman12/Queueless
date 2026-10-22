/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Facility, ServiceCounter, Token, User } from '../types/queue';
import { queueStore } from '../services/storage';
import { calculateCounterWaitTime } from '../services/dsa';
import { Clock, Users, CheckCircle2, AlertTriangle, ArrowLeft, XCircle, Bell, Volume2, ShieldAlert } from 'lucide-react';

interface LiveQueueTrackerProps {
  token: Token;
  facility: Facility;
  counter: ServiceCounter;
  allTokens: Token[];
  currentUser: User;
  onBack: () => void;
  onBookAnother: () => void;
}

export const LiveQueueTracker: React.FC<LiveQueueTrackerProps> = ({
  token,
  facility,
  counter,
  allTokens,
  currentUser,
  onBack,
  onBookAnother,
}) => {
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Ticking timer for live second updates
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute live people ahead and wait time
  const waitingTokens = allTokens.filter(
    (t) => t.counterId === counter.id && (t.status === 'WAITING' || t.status === 'CALLED')
  );

  // Find index of this token in the queue
  const myIndex = waitingTokens.findIndex((t) => t.id === token.id);
  const peopleAhead = myIndex >= 0 ? myIndex : 0;

  const waitCalc = calculateCounterWaitTime(counter, waitingTokens.slice(0, myIndex + 1), now);
  const remainingWaitMinutes = token.status === 'SERVING' || token.status === 'CALLED'
    ? 0
    : Math.max(1, Math.ceil(waitCalc.estimatedSeconds / 60));

  const handleCancelToken = () => {
    queueStore.cancelToken(token.id, currentUser.name);
    setCancelModalOpen(false);
  };

  // Steps definition
  const steps = [
    { key: 'BOOKED', label: 'Booked', done: true },
    {
      key: 'WAITING',
      label: 'In Queue',
      done: token.status === 'WAITING' || token.status === 'CALLED' || token.status === 'SERVING' || token.status === 'COMPLETED',
      active: token.status === 'WAITING',
    },
    {
      key: 'CALLED',
      label: 'Turn Called',
      done: token.status === 'CALLED' || token.status === 'SERVING' || token.status === 'COMPLETED',
      active: token.status === 'CALLED',
    },
    {
      key: 'SERVING',
      label: 'At Counter',
      done: token.status === 'SERVING' || token.status === 'COMPLETED',
      active: token.status === 'SERVING',
    },
    {
      key: 'COMPLETED',
      label: 'Completed',
      done: token.status === 'COMPLETED',
      active: token.status === 'COMPLETED',
    },
  ];

  const isCancelled = token.status === 'CANCELLED';
  const isSkipped = token.status === 'SKIPPED';
  const isCompleted = token.status === 'COMPLETED';
  const isCalledNow = token.status === 'CALLED';

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Top Breadcrumb Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
        <span className="text-xs text-slate-400 font-mono">
          Refreshed: {new Date(now).toLocaleTimeString()}
        </span>
      </div>

      {/* Main Live Ticket Hero Container */}
      <div
        className={`rounded-2xl border p-6 sm:p-8 shadow-sm transition-all ${
          isCalledNow
            ? 'bg-gradient-to-b from-teal-50 to-emerald-50 border-teal-500 ring-2 ring-teal-500/30'
            : isCompleted
            ? 'bg-slate-50 border-emerald-300'
            : isCancelled || isSkipped
            ? 'bg-slate-50 border-rose-200'
            : 'bg-white border-slate-200'
        }`}
      >
        {/* Urgent Turn Called Banner */}
        {isCalledNow && (
          <div className="mb-6 p-4 bg-teal-600 text-white rounded-xl shadow-sm flex items-center justify-between animate-bounce">
            <div className="flex items-center gap-3">
              <Volume2 className="w-6 h-6 shrink-0" />
              <div>
                <p className="font-bold text-sm">Your Token Is Called!</p>
                <p className="text-xs text-teal-100">
                  Please proceed immediately to {counter.name} ({facility.location}).
                </p>
              </div>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded">
              Active Turn
            </span>
          </div>
        )}

        {/* Counter Paused Alert */}
        {counter.status === 'PAUSED' && !isCompleted && !isCancelled && (
          <div className="mb-6 p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <div>
              <span className="font-bold">Counter Temporarily Paused:</span> Staff member is taking a brief break or handling hardware check. Waiting estimates may pause temporarily.
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span className="font-semibold text-teal-800 uppercase tracking-wider">
                {facility.name}
              </span>
              <span>·</span>
              <span>{facility.location}</span>
            </div>
            <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-slate-900">
              {token.tokenNumber}
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Service Desk:{' '}
              <strong className="text-slate-800 font-semibold">{counter.name}</strong> (Desk #{counter.counterNumber})
            </p>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
            <span className="text-xs text-slate-400">Current Token Status</span>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold font-mono uppercase tracking-wider ${
                  token.status === 'WAITING'
                    ? 'bg-blue-100 text-blue-800'
                    : token.status === 'CALLED'
                    ? 'bg-teal-100 text-teal-900'
                    : token.status === 'SERVING'
                    ? 'bg-amber-100 text-amber-900'
                    : token.status === 'COMPLETED'
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'bg-rose-100 text-rose-900'
                }`}
              >
                {token.status}
              </span>
            </div>
          </div>
        </div>

        {/* Live Step Tracker */}
        <div className="py-6">
          <p className="text-xs font-semibold text-slate-500 mb-4 uppercase tracking-wider">
            Queue Progression
          </p>
          <div className="grid grid-cols-5 gap-2">
            {steps.map((step, idx) => (
              <div key={step.key} className="text-center">
                <div
                  className={`h-2 rounded-full mb-2 transition-all ${
                    step.done
                      ? 'bg-teal-600'
                      : 'bg-slate-200'
                  }`}
                />
                <p
                  className={`text-[11px] font-semibold truncate ${
                    step.active
                      ? 'text-teal-700 font-bold'
                      : step.done
                      ? 'text-slate-800'
                      : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p className="text-xs text-slate-400 font-medium">Students Ahead of You</p>
            <p className="text-2xl font-black font-mono tabular-nums text-slate-900 mt-1">
              {isCompleted || isCancelled || isSkipped ? 0 : peopleAhead}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {peopleAhead === 0 ? 'You are next in line!' : 'Waiting ahead'}
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p className="text-xs text-slate-400 font-medium">Est. Remaining Wait</p>
            <p className="text-2xl font-black font-mono tabular-nums text-teal-800 mt-1">
              {isCompleted || isCancelled || isSkipped ? '0 min' : `~${remainingWaitMinutes} min`}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Rolling speed: ~{Math.round(counter.avgServiceDurationSeconds / 60)}m/person
            </p>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p className="text-xs text-slate-400 font-medium">Assigned Staff Desk</p>
            <p className="text-base font-bold text-slate-900 mt-1 truncate">
              {counter.staffName || 'Campus Staff'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
              Status: {counter.status}
            </p>
          </div>
        </div>

        {/* Priority & Eligibility Note */}
        {token.priority !== 'NORMAL' && (
          <div className="mt-4 p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-bold">Priority Ticket Applied ({token.priority})</p>
              <p className="mt-0.5 text-amber-800">
                Reason: {token.priorityReason || 'Authorized priority processing'}. Position managed via Java PriorityQueue.
              </p>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400 font-mono">
            Booked at {new Date(token.bookingTime).toLocaleTimeString()}
          </div>

          <div className="flex items-center gap-3">
            {token.status === 'WAITING' && (
              <button
                onClick={() => setCancelModalOpen(true)}
                className="px-3.5 py-2 text-xs font-semibold text-rose-700 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel Token
              </button>
            )}

            {(isCompleted || isCancelled || isSkipped) && (
              <button
                onClick={onBookAnother}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Book New Token
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-slate-200 shadow-xl space-y-4">
            <div className="w-10 h-10 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Cancel Your Token?</h3>
              <p className="text-xs text-slate-600 mt-1">
                Cancelling will release your position in queue for {facility.name}. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Keep Token
              </button>
              <button
                onClick={handleCancelToken}
                className="flex-1 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
