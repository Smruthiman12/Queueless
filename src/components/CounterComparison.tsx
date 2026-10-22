/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Facility, ServiceCounter, Token, User } from '../types/queue';
import { calculateCounterWaitTime, recommendBestCounter } from '../services/dsa';
import { Sparkles, ArrowUpDown, Clock, Users, Zap, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface CounterComparisonProps {
  facilities: Facility[];
  tokens: Token[];
  currentUser: User;
  selectedFacilityId?: string;
  onSelectFacility: (id: string) => void;
  onBookTokenAtCounter: (facilityId: string, counterId: string) => void;
}

type SortBy = 'wait' | 'queue' | 'speed' | 'status';

export const CounterComparison: React.FC<CounterComparisonProps> = ({
  facilities,
  tokens,
  currentUser,
  selectedFacilityId,
  onSelectFacility,
  onBookTokenAtCounter,
}) => {
  const currentFacilityId = selectedFacilityId || facilities[0]?.id || 'fac-canteen';
  const currentFacility = facilities.find((f) => f.id === currentFacilityId) || facilities[0];

  const [sortBy, setSortBy] = useState<SortBy>('wait');
  const [recommendationExpanded, setRecommendationExpanded] = useState(true);

  if (!currentFacility) {
    return <div className="p-8 text-center text-slate-500">No facilities available.</div>;
  }

  // Calculate recommendation using DSA algorithm
  const recommendation = recommendBestCounter(
    currentFacility.counters,
    tokens,
    'NORMAL'
  );

  // Evaluate all counters for this facility
  const evaluatedCounters = currentFacility.counters.map((counter) => {
    const counterTokens = tokens.filter(
      (t) => t.counterId === counter.id && (t.status === 'WAITING' || t.status === 'CALLED')
    );
    const { estimatedSeconds, remainingCurrentSeconds, queueLength, avgDurationSeconds } =
      calculateCounterWaitTime(counter, counterTokens);

    return {
      counter,
      tokens: counterTokens,
      estimatedSeconds,
      estimatedMinutes: Math.ceil(estimatedSeconds / 60),
      remainingCurrentSeconds,
      queueLength,
      avgDurationSeconds,
      isOptimal: recommendation.bestCounter?.id === counter.id,
    };
  });

  // Sort counters according to user preference
  evaluatedCounters.sort((a, b) => {
    if (sortBy === 'wait') {
      return a.estimatedSeconds - b.estimatedSeconds;
    }
    if (sortBy === 'queue') {
      return a.queueLength - b.queueLength;
    }
    if (sortBy === 'speed') {
      return a.avgDurationSeconds - b.avgDurationSeconds;
    }
    if (sortBy === 'status') {
      const statusOrder = { OPEN: 1, BUSY: 2, PAUSED: 3, CLOSED: 4 };
      return (statusOrder[a.counter.status] || 9) - (statusOrder[b.counter.status] || 9);
    }
    return 0;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Facility Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Algorithmic Load Balancer</span>
            <span>·</span>
            <span>Real-Time Comparison</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Smart Counter Comparison
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Compare active service windows, velocity, and queue depth to pick the fastest line.
          </p>
        </div>

        {/* Facility Picker Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {facilities.map((fac) => (
            <button
              key={fac.id}
              onClick={() => onSelectFacility(fac.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                fac.id === currentFacilityId
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {fac.name}
            </button>
          ))}
        </div>
      </div>

      {/* Algorithmic Recommendation Card */}
      {recommendation.bestCounter && (
        <div className="rounded-xl border border-teal-200 bg-gradient-to-r from-teal-50/90 to-emerald-50/70 p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 mb-0.5">
                  <span>QueueLess Optimizer Recommendation</span>
                  <span>·</span>
                  <span>Minimum Latency</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Recommended: {recommendation.bestCounter.name}
                </h3>
                <p className="text-xs text-slate-700 mt-1 max-w-2xl leading-relaxed">
                  {recommendation.reason}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <p className="text-[11px] text-slate-500">Estimated Wait</p>
                <p className="text-lg font-bold font-mono tabular-nums text-teal-800">
                  ~{recommendation.estimatedWaitMinutes} min
                </p>
              </div>
              <button
                onClick={() => onBookTokenAtCounter(currentFacility.id, recommendation.bestCounter!.id)}
                className="px-4 py-2.5 bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                Book This Counter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Controls & Sorting Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="font-semibold text-slate-900">{currentFacility.counters.length} Counters</span>
          <span>·</span>
          <span>{currentFacility.location}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Sort By:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setSortBy('wait')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                sortBy === 'wait' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Shortest Wait
            </button>
            <button
              onClick={() => setSortBy('queue')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                sortBy === 'queue' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Shortest Queue
            </button>
            <button
              onClick={() => setSortBy('speed')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                sortBy === 'speed' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fastest Speed
            </button>
          </div>
        </div>
      </div>

      {/* Side-by-Side Counters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {evaluatedCounters.map(
          ({
            counter,
            tokens: counterTokens,
            estimatedSeconds,
            estimatedMinutes,
            remainingCurrentSeconds,
            queueLength,
            avgDurationSeconds,
            isOptimal,
          }) => {
            const isPaused = counter.status === 'PAUSED';
            const isClosed = counter.status === 'CLOSED';

            // Wait time color classification
            const waitColorClass = isClosed || isPaused
              ? 'text-slate-500'
              : estimatedMinutes <= 5
              ? 'text-emerald-700'
              : estimatedMinutes <= 12
              ? 'text-amber-700'
              : 'text-rose-700';

            const statusBadgeClass =
              counter.status === 'OPEN'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : counter.status === 'BUSY'
                ? 'bg-blue-50 text-blue-800 border-blue-200'
                : counter.status === 'PAUSED'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-slate-100 text-slate-600 border-slate-200';

            return (
              <div
                key={counter.id}
                className={`rounded-xl border bg-white overflow-hidden shadow-sm flex flex-col justify-between transition-all ${
                  isOptimal
                    ? 'border-teal-500 ring-2 ring-teal-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Header */}
                <div className="p-5 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-400">
                          #{counter.counterNumber}
                        </span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${statusBadgeClass}`}>
                          {counter.status}
                        </span>
                        {isOptimal && (
                          <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            ★ Best Match
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-1">{counter.name}</h3>
                      <p className="text-xs text-slate-500">Staff: {counter.staffName || 'Staff Member'}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Est. Wait</p>
                      <p className={`text-2xl font-bold font-mono tabular-nums ${waitColorClass}`}>
                        {isClosed ? '—' : isPaused ? 'Paused' : `~${estimatedMinutes}m`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Queue Analytics Strip */}
                <div className="p-5 space-y-3 flex-1">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <p className="text-slate-400 text-[10px] font-medium">Waiting Ahead</p>
                      <p className="text-base font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                        {queueLength} {queueLength === 1 ? 'student' : 'students'}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <p className="text-slate-400 text-[10px] font-medium">Avg Service Speed</p>
                      <p className="text-base font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                        {Math.round(avgDurationSeconds / 60)} min / student
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Currently Serving:</span>
                      <span className="font-mono font-medium text-slate-800">
                        {counter.currentlyServingTokenId
                          ? tokens.find((t) => t.id === counter.currentlyServingTokenId)?.tokenNumber || 'In progress'
                          : 'Idle (Ready for next)'}
                      </span>
                    </div>
                    {counter.currentlyServingTokenId && remainingCurrentSeconds > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Current Student Time Left:</span>
                        <span className="font-mono text-slate-800">
                          ~{Math.ceil(remainingCurrentSeconds / 60)} min
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-400">Completed Today:</span>
                      <span className="font-mono text-slate-800">{counter.totalServedToday} served</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Priority Eligibility:</span>
                      <span className="font-medium text-slate-800">
                        {counter.isPriorityEligible ? 'Supported (Accessible / Med)' : 'General Only'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Booking Button */}
                <div className="p-4 bg-slate-50 border-t border-slate-100">
                  <button
                    disabled={isClosed || isPaused}
                    onClick={() => onBookTokenAtCounter(currentFacility.id, counter.id)}
                    className={`w-full py-2.5 px-4 text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs ${
                      isClosed || isPaused
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : isOptimal
                        ? 'bg-teal-700 hover:bg-teal-600 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {isClosed ? 'Counter Closed' : isPaused ? 'Counter Paused' : 'Book at This Counter'}
                  </button>
                </div>
              </div>
            );
          }
        )}
      </div>

      {/* DSA Formula Educational Callout */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 text-xs text-slate-600 space-y-2">
        <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-teal-600" />
          QueueLess Mathematical Allocation Formula
        </h4>
        <p className="leading-relaxed">
          QueueLess computes total estimated waiting time as:{' '}
          <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-800 font-mono">
            W = R_curr + (N_ahead × S_avg)
          </code>
          , where <strong className="text-slate-800">R_curr</strong> is the remaining duration of the student currently at the desk,
          <strong className="text-slate-800"> N_ahead</strong> is waiting students in the queue, and{' '}
          <strong className="text-slate-800">S_avg</strong> is the counter's rolling historical service velocity.
          Counters with slightly longer queues but substantially faster service (e.g. Counter B) are prioritized over slower counters!
        </p>
      </div>
    </div>
  );
};
