/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RefreshCw, UserPlus, Sparkles, Zap, Clock, Users, CheckCircle } from 'lucide-react';

interface SimCounter {
  id: string;
  name: string;
  avgDurationMins: number; // A: 4m, B: 3m, C: 5m
  isPaused: boolean;
  currentStudent: string | null;
  currentElapsedSec: number;
  queue: string[];
  totalServed: number;
}

export const SimulationMode: React.FC = () => {
  const [counters, setCounters] = useState<SimCounter[]>([
    {
      id: 'sim-a',
      name: 'Counter A',
      avgDurationMins: 4,
      isPaused: false,
      currentStudent: 'Student #1',
      currentElapsedSec: 60,
      queue: ['Student #4', 'Student #7'],
      totalServed: 12,
    },
    {
      id: 'sim-b',
      name: 'Counter B (Fastest)',
      avgDurationMins: 3,
      isPaused: false,
      currentStudent: 'Student #2',
      currentElapsedSec: 40,
      queue: ['Student #5'],
      totalServed: 18,
    },
    {
      id: 'sim-c',
      name: 'Counter C',
      avgDurationMins: 5,
      isPaused: false,
      currentStudent: 'Student #3',
      currentElapsedSec: 90,
      queue: ['Student #6', 'Student #8'],
      totalServed: 9,
    },
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(2);
  const [studentCounter, setStudentCounter] = useState(9);
  const [lastRouteReason, setLastRouteReason] = useState<string>(
    'Simulation initialized: Counter B has fastest service velocity (3 min/student).'
  );
  const [totalTimeSavedMins, setTotalTimeSavedMins] = useState(38);

  // Simulation step tick
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setCounters((prev) => {
        return prev.map((cnt) => {
          if (cnt.isPaused) return cnt;

          // If nobody is being served but queue has students, take first
          if (!cnt.currentStudent && cnt.queue.length > 0) {
            const [next, ...rest] = cnt.queue;
            return {
              ...cnt,
              currentStudent: next,
              currentElapsedSec: 0,
              queue: rest,
            };
          }

          if (cnt.currentStudent) {
            const targetSec = cnt.avgDurationMins * 60;
            // Advance by 5s * multiplier per tick
            const newElapsed = cnt.currentElapsedSec + 5 * speedMultiplier;

            if (newElapsed >= targetSec) {
              // Service complete!
              const nextStudent = cnt.queue[0] || null;
              const remainingQueue = cnt.queue.slice(1);
              return {
                ...cnt,
                currentStudent: nextStudent,
                currentElapsedSec: 0,
                queue: remainingQueue,
                totalServed: cnt.totalServed + 1,
              };
            }

            return {
              ...cnt,
              currentElapsedSec: newElapsed,
            };
          }

          return cnt;
        });
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, speedMultiplier]);

  // Compute recommendation
  const getRecommendation = () => {
    let best = counters[0];
    let minWait = Infinity;

    counters.forEach((cnt) => {
      if (cnt.isPaused) return;
      const targetSec = cnt.avgDurationMins * 60;
      const remainingCurrent = cnt.currentStudent
        ? Math.max(0, targetSec - cnt.currentElapsedSec)
        : 0;
      const waitSec = remainingCurrent + cnt.queue.length * targetSec;

      if (waitSec < minWait || (waitSec === minWait && cnt.queue.length < best.queue.length)) {
        minWait = waitSec;
        best = cnt;
      }
    });

    return { best, minWaitMins: Math.ceil(minWait / 60) };
  };

  const currentRec = getRecommendation();

  // Inject a new student using QueueLess Smart Routing
  const handleInjectStudent = () => {
    const studentName = `Student #${studentCounter}`;
    setStudentCounter((c) => c + 1);

    const rec = getRecommendation();
    if (!rec.best) return;

    setCounters((prev) =>
      prev.map((cnt) => {
        if (cnt.id === rec.best.id) {
          return {
            ...cnt,
            queue: [...cnt.queue, studentName],
          };
        }
        return cnt;
      })
    );

    setTotalTimeSavedMins((prev) => prev + Math.floor(Math.random() * 3 + 2));
    setLastRouteReason(
      `Routed ${studentName} to ${rec.best.name}: Lowest computed wait (~${rec.minWaitMins} min) balancing speed (${rec.best.avgDurationMins}m avg) against queue length (${rec.best.queue.length}).`
    );
  };

  const handleResetSimulation = () => {
    setIsRunning(false);
    setCounters([
      {
        id: 'sim-a',
        name: 'Counter A',
        avgDurationMins: 4,
        isPaused: false,
        currentStudent: 'Student #1',
        currentElapsedSec: 60,
        queue: ['Student #4', 'Student #7'],
        totalServed: 12,
      },
      {
        id: 'sim-b',
        name: 'Counter B (Fastest)',
        avgDurationMins: 3,
        isPaused: false,
        currentStudent: 'Student #2',
        currentElapsedSec: 40,
        queue: ['Student #5'],
        totalServed: 18,
      },
      {
        id: 'sim-c',
        name: 'Counter C',
        avgDurationMins: 5,
        isPaused: false,
        currentStudent: 'Student #3',
        currentElapsedSec: 90,
        queue: ['Student #6', 'Student #8'],
        totalServed: 9,
      },
    ]);
    setStudentCounter(9);
    setTotalTimeSavedMins(38);
    setLastRouteReason('Reset to benchmark state.');
  };

  const togglePauseCounter = (id: string) => {
    setCounters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isPaused: !c.isPaused } : c))
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Dynamic Load Balancer Benchmark</span>
            <span>·</span>
            <span>Interactive Simulator</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Three-Counter Simulation
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Test how QueueLess dynamically balances Counter A (4m), Counter B (3m), and Counter C (5m).
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            {[1, 2, 5].map((multiplier) => (
              <button
                key={multiplier}
                onClick={() => setSpeedMultiplier(multiplier)}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  speedMultiplier === multiplier ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                {multiplier}x Speed
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm ${
              isRunning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-teal-700 hover:bg-teal-600'
            }`}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isRunning ? 'Pause Sim' : 'Start Sim'}</span>
          </button>

          <button
            onClick={handleResetSimulation}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Reset Simulation"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Real-time Optimizer Routing Banner */}
      <div className="rounded-xl border border-teal-200 bg-teal-50/80 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-teal-800 uppercase tracking-wider">
              Smart Counter Routing Decision
            </p>
            <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">
              {lastRouteReason}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-[10px] text-slate-400">Time Saved by QueueLess</p>
            <p className="text-base font-bold font-mono text-teal-800">
              +{totalTimeSavedMins} mins saved
            </p>
          </div>
          <button
            onClick={handleInjectStudent}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Inject Student</span>
          </button>
        </div>
      </div>

      {/* 3 Counters Side-by-Side Simulation Arena */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {counters.map((cnt) => {
          const targetSec = cnt.avgDurationMins * 60;
          const progressPercent = cnt.currentStudent
            ? Math.min(100, Math.round((cnt.currentElapsedSec / targetSec) * 100))
            : 0;

          const remainingSec = cnt.currentStudent
            ? Math.max(0, targetSec - cnt.currentElapsedSec)
            : 0;
          const totalWaitMins = Math.ceil((remainingSec + cnt.queue.length * targetSec) / 60);

          const isRecommended = currentRec.best?.id === cnt.id;

          return (
            <div
              key={cnt.id}
              className={`rounded-2xl border bg-white overflow-hidden shadow-sm flex flex-col justify-between transition-all ${
                isRecommended
                  ? 'border-teal-500 ring-2 ring-teal-500/20'
                  : 'border-slate-200'
              }`}
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-slate-900 text-base">{cnt.name}</h3>
                  <button
                    onClick={() => togglePauseCounter(cnt.id)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                      cnt.isPaused
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cnt.isPaused ? 'PAUSED' : 'ACTIVE'}
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 font-mono mt-1">
                  <span>Speed: ~{cnt.avgDurationMins} min/student</span>
                  <span className={cnt.avgDurationMins === 3 ? 'text-teal-700 font-bold' : ''}>
                    {cnt.avgDurationMins === 3 ? '★ Fastest Velocity' : ''}
                  </span>
                </div>
              </div>

              {/* Desk Serving Zone */}
              <div className="p-5 space-y-4 flex-1">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    At Counter
                  </span>
                  <p className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                    {cnt.isPaused
                      ? 'Desk Paused'
                      : cnt.currentStudent || 'Idle (Awaiting next)'}
                  </p>

                  {cnt.currentStudent && !cnt.isPaused && (
                    <div className="mt-2 space-y-1">
                      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-600 transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>{cnt.currentElapsedSec}s elapsed</span>
                        <span>{Math.ceil(remainingSec / 60)}m left</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Queue Strip */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold text-slate-700">Waiting Line</span>
                    <span className="font-mono text-slate-400">{cnt.queue.length} in line</span>
                  </div>

                  {cnt.queue.length === 0 ? (
                    <div className="py-4 text-center text-slate-400 text-xs font-mono bg-slate-50 rounded-lg border border-dashed border-slate-200">
                      Empty queue
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {cnt.queue.map((student, idx) => (
                        <div
                          key={idx}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-xs flex items-center justify-between"
                        >
                          <span className="font-mono text-slate-800">{student}</span>
                          <span className="text-[10px] text-slate-400 font-mono">Pos #{idx + 1}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Total Served & Est Wait Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <p className="text-slate-400">Total Served</p>
                  <p className="font-bold text-slate-900 font-mono">{cnt.totalServed}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400">Est. Total Wait</p>
                  <p className="font-bold text-slate-900 font-mono">~{totalWaitMins} min</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
