/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Facility, PriorityLevel, ServiceCounter, Token, User } from '../types/queue';
import { queueStore } from '../services/storage';
import { calculateCounterWaitTime, recommendBestCounter } from '../services/dsa';
import confetti from 'canvas-confetti';
import { X, CheckCircle2, QrCode, AlertCircle, ShieldAlert, Sparkles } from 'lucide-react';

interface TokenBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  facilities: Facility[];
  tokens: Token[];
  initialFacilityId?: string;
  initialCounterId?: string;
  onBookingSuccess: (token: Token) => void;
}

export const TokenBookingModal: React.FC<TokenBookingModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  facilities,
  tokens,
  initialFacilityId,
  initialCounterId,
  onBookingSuccess,
}) => {
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(
    initialFacilityId || facilities[0]?.id || 'fac-canteen'
  );
  const [selectedCounterId, setSelectedCounterId] = useState<string>(
    initialCounterId || ''
  );
  const [priority, setPriority] = useState<PriorityLevel>('NORMAL');
  const [priorityReason, setPriorityReason] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdToken, setCreatedToken] = useState<Token | null>(null);

  if (!isOpen) return null;

  const facility = facilities.find((f) => f.id === selectedFacilityId) || facilities[0];
  const eligibleCounters = facility?.counters.filter(
    (c) => c.status === 'OPEN' || c.status === 'BUSY'
  ) || [];

  // Auto recommend if no counter selected
  const rec = recommendBestCounter(facility?.counters || [], tokens, priority);
  const effectiveCounterId = selectedCounterId || rec.bestCounter?.id || eligibleCounters[0]?.id;
  const currentCounter = facility?.counters.find((c) => c.id === effectiveCounterId);

  // Calculate live preview metrics
  const counterTokens = tokens.filter(
    (t) => t.counterId === effectiveCounterId && (t.status === 'WAITING' || t.status === 'CALLED')
  );
  const waitInfo = currentCounter
    ? calculateCounterWaitTime(currentCounter, counterTokens)
    : { estimatedSeconds: 0, queueLength: 0 };

  const handleBook = () => {
    setErrorMessage(null);
    if (!facility || !effectiveCounterId) {
      setErrorMessage('Please select a valid counter.');
      return;
    }

    if (priority !== 'NORMAL' && !priorityReason.trim()) {
      setErrorMessage('Please provide a reason or authorized pass number for priority processing.');
      return;
    }

    const res = queueStore.bookToken({
      facilityId: facility.id,
      counterId: effectiveCounterId,
      student: currentUser,
      priority,
      priorityReason: priority !== 'NORMAL' ? priorityReason : undefined,
    });

    if (!res.success || !res.token) {
      setErrorMessage(res.error || 'Failed to book token.');
      return;
    }

    setCreatedToken(res.token);

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  };

  const handleDone = () => {
    if (createdToken) {
      onBookingSuccess(createdToken);
    }
    onClose();
    setCreatedToken(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {createdToken ? 'Token Confirmed' : 'Book Digital Token'}
            </h2>
            <p className="text-xs text-slate-500">
              {createdToken ? 'Your spot in queue is secured' : 'Instant campus queue reservation'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {createdToken ? (
            /* Booking Success Receipt Screen */
            <div className="text-center space-y-5">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <p className="text-xs font-semibold text-teal-800 uppercase tracking-wider">
                  {facility.name}
                </p>
                <div className="mt-1 text-4xl font-extrabold font-mono text-slate-900 tracking-tight">
                  {createdToken.tokenNumber}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Issued to {createdToken.studentName} ({createdToken.studentRollNo})
                </p>
              </div>

              {/* QR Code Simulation Canvas */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 max-w-[220px] mx-auto flex flex-col items-center">
                <div className="w-36 h-36 bg-white p-2 border border-slate-200 rounded-lg flex items-center justify-center">
                  {/* Decorative High-Contrast Scannable SVG Pattern */}
                  <svg className="w-full h-full text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                    {/* Corners */}
                    <rect x="5" y="5" width="26" height="26" fill="black" />
                    <rect x="9" y="9" width="18" height="18" fill="white" />
                    <rect x="13" y="13" width="10" height="10" fill="black" />

                    <rect x="69" y="5" width="26" height="26" fill="black" />
                    <rect x="73" y="9" width="18" height="18" fill="white" />
                    <rect x="77" y="13" width="10" height="10" fill="black" />

                    <rect x="5" y="69" width="26" height="26" fill="black" />
                    <rect x="9" y="73" width="18" height="18" fill="white" />
                    <rect x="13" y="77" width="10" height="10" fill="black" />

                    {/* Matrix payload bits */}
                    <rect x="36" y="8" width="6" height="6" />
                    <rect x="46" y="8" width="6" height="6" />
                    <rect x="36" y="20" width="6" height="12" />
                    <rect x="48" y="20" width="12" height="6" />
                    <rect x="8" y="38" width="12" height="6" />
                    <rect x="25" y="38" width="6" height="14" />
                    <rect x="38" y="38" width="14" height="6" />
                    <rect x="60" y="38" width="8" height="8" />
                    <rect x="75" y="38" width="18" height="6" />
                    <rect x="38" y="52" width="6" height="14" />
                    <rect x="52" y="52" width="14" height="6" />
                    <rect x="72" y="52" width="6" height="16" />
                    <rect x="84" y="52" width="8" height="8" />
                    <rect x="38" y="72" width="18" height="6" />
                    <rect x="45" y="84" width="12" height="8" />
                    <rect x="65" y="75" width="8" height="14" />
                    <rect x="80" y="80" width="12" height="8" />
                  </svg>
                </div>
                <p className="text-[10px] text-slate-500 font-mono mt-2 uppercase">
                  Scan at {currentCounter?.name}
                </p>
              </div>

              {/* Position & Time Summary */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <p className="text-slate-400">Position in Line</p>
                  <p className="text-lg font-bold font-mono text-slate-900">
                    #{createdToken.positionInQueue}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Estimated Wait</p>
                  <p className="text-lg font-bold font-mono text-teal-800">
                    ~{createdToken.estimatedWaitMinutes} min
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleDone}
                  className="w-full py-2.5 px-4 bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  Track Live Queue Now
                </button>
              </div>
            </div>
          ) : (
            /* Booking Form */
            <div className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Unable to book token</p>
                    <p className="mt-0.5">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Student Identity Card */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">Booking for:</span>
                  <p className="font-bold text-slate-900">{currentUser.name}</p>
                  <p className="text-slate-500 font-mono">ID: {currentUser.studentId || '2024CS108'}</p>
                </div>
                <span className="text-[11px] font-semibold text-teal-800 bg-teal-100/60 px-2 py-0.5 rounded">
                  Verified Student
                </span>
              </div>

              {/* Facility Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Campus Facility
                </label>
                <select
                  value={selectedFacilityId}
                  onChange={(e) => {
                    setSelectedFacilityId(e.target.value);
                    setSelectedCounterId('');
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                >
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} — ({f.location})
                    </option>
                  ))}
                </select>
              </div>

              {/* Counter Selection with Smart Recommender indicator */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">Service Counter</label>
                  {rec.bestCounter && (
                    <span className="text-[11px] text-teal-700 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Auto-selected lowest wait
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {facility.counters.map((cnt) => {
                    const cntWait = calculateCounterWaitTime(
                      cnt,
                      tokens.filter(
                        (t) => t.counterId === cnt.id && (t.status === 'WAITING' || t.status === 'CALLED')
                      )
                    );
                    const isSelected = effectiveCounterId === cnt.id;
                    const isBest = rec.bestCounter?.id === cnt.id;
                    const isAvailable = cnt.status === 'OPEN' || cnt.status === 'BUSY';

                    return (
                      <button
                        type="button"
                        key={cnt.id}
                        disabled={!isAvailable}
                        onClick={() => setSelectedCounterId(cnt.id)}
                        className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between cursor-pointer ${
                          !isAvailable
                            ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                            : isSelected
                            ? 'bg-teal-50/70 border-teal-500 ring-1 ring-teal-500'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{cnt.name}</span>
                            {isBest && (
                              <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-1.5 py-0.2 rounded">
                                Fastest
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {cntWait.queueLength} waiting ahead · avg {Math.round(cnt.avgServiceDurationSeconds / 60)}m/student
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="font-mono font-bold text-slate-900 text-sm">
                            {isAvailable ? `~${Math.ceil(cntWait.estimatedSeconds / 60)} min` : cnt.status}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Priority Category Section */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Priority Category (DSA PriorityQueue)
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'NORMAL', label: 'General Student (FIFO)' },
                    { id: 'ACCESSIBLE', label: 'Accessible / Differently Abled' },
                    { id: 'EMERGENCY', label: 'Medical / Urgent Admin' },
                    { id: 'FACULTY_REFERRAL', label: 'Faculty Referral' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setPriority(cat.id as PriorityLevel)}
                      className={`p-2.5 rounded-xl border text-left font-medium transition-colors cursor-pointer ${
                        priority === cat.id
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {priority !== 'NORMAL' && (
                  <div className="mt-2.5 space-y-1">
                    <label className="text-[11px] font-medium text-slate-600">
                      State Reason / Authorization Pass ID:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Campus Accessibility Card #MED-402"
                      value={priorityReason}
                      onChange={(e) => setPriorityReason(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                )}
              </div>

              {/* Estimated Summary Before Booking */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <p className="text-slate-500">Live Estimated Waiting Time</p>
                  <p className="font-bold text-slate-900 font-mono text-sm">
                    ~{Math.ceil(waitInfo.estimatedSeconds / 60)} minutes
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500">Queue Position</p>
                  <p className="font-bold text-slate-900 font-mono text-sm">
                    #{waitInfo.queueLength + 1}
                  </p>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="button"
                onClick={handleBook}
                className="w-full py-3 px-4 bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Confirm & Book Digital Token
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
