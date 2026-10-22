/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArrayDequeQueue, PriorityQueue, CircularQueue, PRIORITY_WEIGHTS, tokenPriorityComparator, generateQuickSortSteps } from '../services/dsa';
import { PriorityLevel, Token } from '../types/queue';
import { ArrowRight, Layers, ArrowDownUp, RefreshCw, Play, SkipForward, Info, Zap, Sparkles } from 'lucide-react';

interface SimulatedStudent {
  id: string;
  name: string;
  priority: PriorityLevel;
  arrivalOrder: number;
}

export const DsaLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'fifo' | 'priority' | 'circular' | 'sorting' | 'allocation'>('fifo');

  // --- 1. ArrayDeque FIFO State ---
  const [fifoQueue, setFifoQueue] = useState<SimulatedStudent[]>([
    { id: '1', name: 'Student #1 (Aarav)', priority: 'NORMAL', arrivalOrder: 1 },
    { id: '2', name: 'Student #2 (Chloe)', priority: 'NORMAL', arrivalOrder: 2 },
    { id: '3', name: 'Student #3 (David)', priority: 'NORMAL', arrivalOrder: 3 },
  ]);
  const [fifoOpLog, setFifoOpLog] = useState<string>('Initialized with 3 students in FIFO order.');

  const handleFifoEnqueue = () => {
    const nextOrder = fifoQueue.length > 0 ? Math.max(...fifoQueue.map((s) => s.arrivalOrder)) + 1 : 1;
    const names = ['Emma', 'Liam', 'Lucas', 'Mia', 'Noah', 'Sophia', 'Zayd'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const newStudent: SimulatedStudent = {
      id: `${Date.now()}`,
      name: `Student #${nextOrder} (${randomName})`,
      priority: 'NORMAL',
      arrivalOrder: nextOrder,
    };
    setFifoQueue([...fifoQueue, newStudent]);
    setFifoOpLog(`enqueue(Student #${nextOrder}): Added to tail in O(1) amortized time.`);
  };

  const handleFifoDequeue = () => {
    if (fifoQueue.length === 0) {
      setFifoOpLog('dequeue() called on empty queue: null returned in O(1) time.');
      return;
    }
    const [served, ...remaining] = fifoQueue;
    setFifoQueue(remaining);
    setFifoOpLog(`dequeue(): Served head ${served.name} in O(1) time.`);
  };

  const handleFifoPeek = () => {
    if (fifoQueue.length === 0) {
      setFifoOpLog('peek() returned null (Queue empty).');
      return;
    }
    setFifoOpLog(`peek(): Inspecting head element ${fifoQueue[0].name} in O(1) without removal.`);
  };

  // --- 2. PriorityQueue (Binary Heap) State ---
  const [priorityItems, setPriorityItems] = useState<SimulatedStudent[]>([
    { id: 'p1', name: 'Aarav (Normal)', priority: 'NORMAL', arrivalOrder: 1 },
    { id: 'p2', name: 'Dr. Rao Referral', priority: 'FACULTY_REFERRAL', arrivalOrder: 2 },
    { id: 'p3', name: 'Meera (Accessibility)', priority: 'ACCESSIBLE', arrivalOrder: 3 },
  ]);
  const [priorityOpLog, setPriorityOpLog] = useState<string>(
    'Priority Queue initialized with comparator [weight desc, arrivalOrder asc].'
  );

  const getSortedPriorityList = () => {
    return [...priorityItems].sort((a, b) => {
      const wDiff = (PRIORITY_WEIGHTS[b.priority] || 0) - (PRIORITY_WEIGHTS[a.priority] || 0);
      if (wDiff !== 0) return wDiff;
      return a.arrivalOrder - b.arrivalOrder;
    });
  };

  const handlePriorityInsert = (level: PriorityLevel) => {
    const nextOrder = priorityItems.length + 1;
    const labels: Record<PriorityLevel, string> = {
      EMERGENCY: 'Emergency Case',
      ACCESSIBLE: 'Medical/Accessibility',
      FACULTY_REFERRAL: 'Faculty Pass',
      NORMAL: 'Standard Ticket',
    };
    const newItem: SimulatedStudent = {
      id: `p-${Date.now()}`,
      name: `${labels[level]} #${nextOrder}`,
      priority: level,
      arrivalOrder: nextOrder,
    };
    setPriorityItems([...priorityItems, newItem]);
    setPriorityOpLog(
      `offer(${newItem.name}, ${level}): Heap sift-up performed in O(log N) time.`
    );
  };

  const handlePriorityPoll = () => {
    if (priorityItems.length === 0) {
      setPriorityOpLog('poll(): PriorityQueue underflow (empty).');
      return;
    }
    const sorted = getSortedPriorityList();
    const top = sorted[0];
    setPriorityItems(priorityItems.filter((i) => i.id !== top.id));
    setPriorityOpLog(
      `poll(): Extracted highest priority element (${top.name}, tier: ${top.priority}) in O(log N).`
    );
  };

  // --- 3. Circular Queue State ---
  const [circularCapacity] = useState(6);
  const [circularBuffer, setCircularBuffer] = useState<(string | null)[]>([
    'T-101',
    'T-102',
    'T-103',
    null,
    null,
    null,
  ]);
  const [circularHead, setCircularHead] = useState(0);
  const [circularTail, setCircularTail] = useState(3);
  const [circularCount, setCircularCount] = useState(3);
  const [circularOpLog, setCircularOpLog] = useState(
    'Circular buffer initialized with capacity 6, head=0, tail=3, count=3.'
  );

  const handleCircularEnqueue = () => {
    if (circularCount === circularCapacity) {
      setCircularOpLog('Overflow Error: Circular buffer is full! Cannot enqueue.');
      return;
    }
    const nextToken = `T-${100 + circularTail + 1}`;
    const newBuf = [...circularBuffer];
    newBuf[circularTail] = nextToken;
    const nextTail = (circularTail + 1) % circularCapacity;
    setCircularBuffer(newBuf);
    setCircularTail(nextTail);
    setCircularCount(circularCount + 1);
    setCircularOpLog(
      `enqueue(${nextToken}): Written to slot [${circularTail}]. tail advances to (tail + 1) % 6 = ${nextTail}.`
    );
  };

  const handleCircularDequeue = () => {
    if (circularCount === 0) {
      setCircularOpLog('Underflow Error: Circular buffer is empty! Cannot dequeue.');
      return;
    }
    const removedItem = circularBuffer[circularHead];
    const newBuf = [...circularBuffer];
    newBuf[circularHead] = null;
    const nextHead = (circularHead + 1) % circularCapacity;
    setCircularBuffer(newBuf);
    setCircularHead(nextHead);
    setCircularCount(circularCount - 1);
    setCircularOpLog(
      `dequeue(): Cleared slot [${circularHead}] (${removedItem}). head advances to (head + 1) % 6 = ${nextHead}.`
    );
  };

  // --- 4. Sorting Step-Through State ---
  const [sortInputArray, setSortInputArray] = useState<number[]>([18, 4, 12, 6, 24, 9]);
  const [sortSteps, setSortSteps] = useState(generateQuickSortSteps([18, 4, 12, 6, 24, 9]));
  const [currentSortStepIndex, setCurrentSortStepIndex] = useState(0);

  const handleShuffleSortData = () => {
    const randomArray = Array.from({ length: 6 }, () => Math.floor(Math.random() * 25) + 3);
    setSortInputArray(randomArray);
    setSortSteps(generateQuickSortSteps(randomArray));
    setCurrentSortStepIndex(0);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title & Overview */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
          <span>Interactive Computer Science Laboratory</span>
          <span>·</span>
          <span>Data Structures & Algorithms</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          QueueLess DSA Lab
        </h1>
        <p className="text-xs text-slate-600 mt-0.5">
          Step-by-step visual demonstrations of FIFO queues, Priority Binary Heaps, Circular Buffers, and Sorting algorithms.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-2 text-xs font-semibold">
        {[
          { id: 'fifo', label: '1. Normal Queue (ArrayDeque)' },
          { id: 'priority', label: '2. Priority Queue (Binary Heap)' },
          { id: 'circular', label: '3. Circular Queue (Fixed Buffer)' },
          { id: 'sorting', label: '4. QuickSort Step-Through' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: ARRAYDEQUE FIFO QUEUE */}
      {activeTab === 'fifo' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Normal Queue (FIFO) — Java ArrayDeque
                </h3>
                <p className="text-xs text-slate-500">
                  Standard first-in, first-out line preserving arrival order without reallocation overhead.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded">
                  enqueue: O(1) amortized · dequeue: O(1) · peek: O(1)
                </span>
              </div>
            </div>

            {/* Visual Queue Ribbon */}
            <div className="py-6 bg-slate-50 rounded-xl border border-slate-200 p-4 overflow-x-auto">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-mono">
                <span className="text-emerald-700 font-bold">← FRONT (Head / Dequeue)</span>
                <span className="text-blue-700 font-bold">REAR (Tail / Enqueue) →</span>
              </div>

              {fifoQueue.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs font-mono">
                  Queue is empty (size = 0)
                </div>
              ) : (
                <div className="flex items-center gap-3 min-w-max py-2">
                  {fifoQueue.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`w-36 p-3 rounded-xl border shadow-xs transition-all text-center flex flex-col justify-between ${
                        idx === 0
                          ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-500/30'
                          : idx === fifoQueue.length - 1
                          ? 'bg-blue-50 border-blue-400'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                        <span>Pos #{idx + 1}</span>
                        {idx === 0 && <span className="font-bold text-teal-700">HEAD</span>}
                        {idx === fifoQueue.length - 1 && (
                          <span className="font-bold text-blue-700">TAIL</span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-900">{item.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-1">
                        Arrival #{item.arrivalOrder}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Interactive Operations Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleFifoEnqueue}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                + Enqueue Student (O(1))
              </button>
              <button
                onClick={handleFifoDequeue}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Serve Head / Dequeue (O(1))
              </button>
              <button
                onClick={handleFifoPeek}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Peek Head (O(1))
              </button>
              <button
                onClick={() => {
                  setFifoQueue([]);
                  setFifoOpLog('Queue cleared.');
                }}
                className="px-3.5 py-2 text-rose-700 hover:bg-rose-50 border border-rose-200 text-xs font-medium rounded-lg transition-colors cursor-pointer ml-auto"
              >
                Clear Queue
              </button>
            </div>

            {/* Operations Console Log */}
            <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs flex items-center gap-2">
              <span className="text-teal-400 font-bold">&gt;_</span>
              <span>{fifoOpLog}</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRIORITY QUEUE (BINARY HEAP) */}
      {activeTab === 'priority' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Priority Queue — Java PriorityQueue (Binary Max-Heap by Weight)
                </h3>
                <p className="text-xs text-slate-500">
                  Ensures accessibility passes and medical emergencies jump the line while maintaining FIFO order for equal priority.
                </p>
              </div>
              <span className="text-[11px] font-mono bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded">
                offer(): O(log N) · poll(): O(log N) · peek(): O(1)
              </span>
            </div>

            {/* Sorted Priority Queue Elements */}
            <div className="py-6 bg-slate-50 rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-slate-500 font-mono mb-3">
                Current Extracted Serve Order (Highest Priority First):
              </p>

              {priorityItems.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs font-mono">
                  Priority heap is empty
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {getSortedPriorityList().map((item, idx) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border text-xs shadow-xs ${
                        idx === 0
                          ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-300/40'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-slate-400 text-[10px]">
                          Rank #{idx + 1} {idx === 0 && '★ NEXT SERVED'}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            item.priority === 'EMERGENCY'
                              ? 'bg-rose-100 text-rose-800'
                              : item.priority === 'ACCESSIBLE'
                              ? 'bg-amber-100 text-amber-800'
                              : item.priority === 'FACULTY_REFERRAL'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.priority}
                        </span>
                      </div>
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-1">
                        Arrival Sequence #{item.arrivalOrder} · Weight: {PRIORITY_WEIGHTS[item.priority]}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions for Priority Insertion */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-700">Insert Priority Ticket (O(log N)):</p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handlePriorityInsert('EMERGENCY')}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  + Emergency (Weight 300)
                </button>
                <button
                  onClick={() => handlePriorityInsert('ACCESSIBLE')}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  + Accessibility Pass (Weight 200)
                </button>
                <button
                  onClick={() => handlePriorityInsert('FACULTY_REFERRAL')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  + Faculty Referral (Weight 100)
                </button>
                <button
                  onClick={() => handlePriorityInsert('NORMAL')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  + Standard Student (Weight 0)
                </button>
                <button
                  onClick={handlePriorityPoll}
                  className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer ml-auto"
                >
                  Poll Next (Serve Highest)
                </button>
              </div>
            </div>

            {/* Operation Log */}
            <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs flex items-center gap-2">
              <span className="text-teal-400 font-bold">&gt;_</span>
              <span>{priorityOpLog}</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CIRCULAR QUEUE */}
      {activeTab === 'circular' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Circular Queue — Fixed-Size Ring Buffer
                </h3>
                <p className="text-xs text-slate-500">
                  Fixed memory buffer reusing memory slots with head and tail pointers: index = (index + 1) % capacity.
                </p>
              </div>
              <span className="text-[11px] font-mono bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded">
                Modulo Wraparound: (tail + 1) % 6
              </span>
            </div>

            {/* Ring Buffer Graphic */}
            <div className="py-8 bg-slate-50 rounded-xl border border-slate-200 p-6 flex flex-col items-center">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 w-full max-w-xl">
                {circularBuffer.map((val, idx) => {
                  const isHead = idx === circularHead && circularCount > 0;
                  const isTail = idx === circularTail;

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border text-center transition-all ${
                        val
                          ? 'bg-white border-slate-300 shadow-xs'
                          : 'bg-slate-100/70 border-dashed border-slate-300'
                      }`}
                    >
                      <span className="font-mono text-[10px] text-slate-400 block mb-1">
                        Slot [{idx}]
                      </span>
                      <p className="text-sm font-bold font-mono text-slate-900">
                        {val || '—'}
                      </p>
                      <div className="mt-2 space-y-0.5">
                        {isHead && (
                          <span className="block text-[9px] font-bold text-teal-700 bg-teal-100 rounded px-1">
                            HEAD
                          </span>
                        )}
                        {isTail && (
                          <span className="block text-[9px] font-bold text-blue-700 bg-blue-100 rounded px-1">
                            TAIL
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-slate-600">
                <span>Head Pointer: <strong>[{circularHead}]</strong></span>
                <span>Tail Pointer: <strong>[{circularTail}]</strong></span>
                <span>Elements: <strong>{circularCount} / {circularCapacity}</strong></span>
              </div>
            </div>

            {/* Circular Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleCircularEnqueue}
                disabled={circularCount === circularCapacity}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Enqueue Token
              </button>
              <button
                onClick={handleCircularDequeue}
                disabled={circularCount === 0}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-600 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Dequeue Token
              </button>
              <button
                onClick={() => {
                  setCircularBuffer(new Array(circularCapacity).fill(null));
                  setCircularHead(0);
                  setCircularTail(0);
                  setCircularCount(0);
                  setCircularOpLog('Reset circular buffer to empty state.');
                }}
                className="px-3.5 py-2 text-rose-700 hover:bg-rose-50 border border-rose-200 text-xs font-medium rounded-lg transition-colors cursor-pointer ml-auto"
              >
                Reset Buffer
              </button>
            </div>

            {/* Circular Log */}
            <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs flex items-center gap-2">
              <span className="text-teal-400 font-bold">&gt;_</span>
              <span>{circularOpLog}</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: QUICKSORT STEP-THROUGH */}
      {activeTab === 'sorting' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Counter Sorting Algorithm — QuickSort (O(N log N))
                </h3>
                <p className="text-xs text-slate-500">
                  Ranks counters by estimated waiting time using divide-and-conquer partition strategy.
                </p>
              </div>
              <button
                onClick={handleShuffleSortData}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Shuffle Wait Times</span>
              </button>
            </div>

            {/* Stepper Controls */}
            <div className="flex items-center justify-between text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="font-semibold text-slate-800">
                Step {currentSortStepIndex + 1} of {sortSteps.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentSortStepIndex === 0}
                  onClick={() => setCurrentSortStepIndex(Math.max(0, currentSortStepIndex - 1))}
                  className="px-3 py-1 rounded bg-white border border-slate-200 text-slate-700 disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  disabled={currentSortStepIndex === sortSteps.length - 1}
                  onClick={() =>
                    setCurrentSortStepIndex(Math.min(sortSteps.length - 1, currentSortStepIndex + 1))
                  }
                  className="px-3 py-1 rounded bg-teal-700 text-white font-bold disabled:opacity-40 cursor-pointer"
                >
                  Next Step
                </button>
              </div>
            </div>

            {/* Array Bars Visualization */}
            <div className="py-8 bg-slate-50 rounded-xl border border-slate-200 p-6 flex flex-col items-center justify-center">
              <div className="flex items-end gap-3 h-48 w-full max-w-md justify-center">
                {sortSteps[currentSortStepIndex]?.arrayState.map((val, idx) => {
                  const isHighlighted = sortSteps[currentSortStepIndex]?.highlightedIndices.includes(idx);
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-xs font-bold font-mono tabular-nums text-slate-900">
                        {val}m
                      </span>
                      <div
                        style={{ height: `${Math.max(20, val * 6)}px` }}
                        className={`w-full rounded-t-lg transition-all ${
                          isHighlighted
                            ? 'bg-teal-600 ring-2 ring-teal-400'
                            : 'bg-slate-400'
                        }`}
                      />
                      <span className="text-[10px] text-slate-400 font-mono">
                        C-{idx + 1}
                      </span>
                    </div>
                  );
                })}
              </div>

              <p className="mt-4 text-xs text-slate-700 font-medium text-center">
                {sortSteps[currentSortStepIndex]?.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
