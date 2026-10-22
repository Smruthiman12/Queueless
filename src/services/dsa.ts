/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PriorityLevel, ServiceCounter, Token } from '../types/queue';

/**
 * Normal FIFO Queue implementation mimicking Java's ArrayDeque
 * Operations:
 * - enqueue: O(1) amortized
 * - dequeue: O(1)
 * - peek: O(1)
 */
export class ArrayDequeQueue<T> {
  private items: T[] = [];

  constructor(initialItems: T[] = []) {
    this.items = [...initialItems];
  }

  enqueue(item: T): void {
    this.items.push(item);
  }

  dequeue(): T | undefined {
    return this.items.shift();
  }

  peek(): T | undefined {
    return this.items.length > 0 ? this.items[0] : undefined;
  }

  size(): number {
    return this.items.length;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  toArray(): T[] {
    return [...this.items];
  }

  clear(): void {
    this.items = [];
  }
}

/**
 * Priority Level Numerical Weight for Comparator
 */
export const PRIORITY_WEIGHTS: Record<PriorityLevel, number> = {
  EMERGENCY: 300,
  ACCESSIBLE: 200,
  FACULTY_REFERRAL: 100,
  NORMAL: 0,
};

/**
 * Priority Queue implemented via Binary Heap mimicking Java's java.util.PriorityQueue
 * Supported operations:
 * - push (offer): O(log N)
 * - pop (poll): O(log N)
 * - peek: O(1)
 * Preserves FIFO order among identical priority levels using arrival timestamp.
 */
export class PriorityQueue<T> {
  private heap: T[] = [];
  private comparator: (a: T, b: T) => number;

  /**
   * comparator should return negative if a has higher priority than b (served earlier),
   * positive if b has higher priority than a, 0 if equal.
   */
  constructor(comparator: (a: T, b: T) => number, initialItems: T[] = []) {
    this.comparator = comparator;
    if (initialItems.length > 0) {
      initialItems.forEach(item => this.offer(item));
    }
  }

  offer(item: T): void {
    this.heap.push(item);
    this.siftUp(this.heap.length - 1);
  }

  poll(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const bottom = this.heap.pop();
    if (this.heap.length > 0 && bottom !== undefined) {
      this.heap[0] = bottom;
      this.siftDown(0);
    }
    return top;
  }

  peek(): T | undefined {
    return this.heap.length > 0 ? this.heap[0] : undefined;
  }

  size(): number {
    return this.heap.length;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  toArray(): T[] {
    // Return sorted elements according to priority without modifying heap
    const copy = new PriorityQueue<T>(this.comparator, [...this.heap]);
    const result: T[] = [];
    while (!copy.isEmpty()) {
      const el = copy.poll();
      if (el !== undefined) result.push(el);
    }
    return result;
  }

  getRawHeap(): T[] {
    return [...this.heap];
  }

  private siftUp(index: number): void {
    let current = index;
    while (current > 0) {
      const parent = Math.floor((current - 1) / 2);
      if (this.comparator(this.heap[current], this.heap[parent]) < 0) {
        this.swap(current, parent);
        current = parent;
      } else {
        break;
      }
    }
  }

  private siftDown(index: number): void {
    let current = index;
    const length = this.heap.length;
    while (true) {
      let candidate = current;
      const left = 2 * current + 1;
      const right = 2 * current + 2;

      if (left < length && this.comparator(this.heap[left], this.heap[candidate]) < 0) {
        candidate = left;
      }
      if (right < length && this.comparator(this.heap[right], this.heap[candidate]) < 0) {
        candidate = right;
      }

      if (candidate !== current) {
        this.swap(current, candidate);
        current = candidate;
      } else {
        break;
      }
    }
  }

  private swap(i: number, j: number): void {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
  }
}

/**
 * Token Comparator for PriorityQueue
 * 1. Higher priority weight wins
 * 2. If same priority, earlier bookingTime wins (FIFO within priority)
 */
export function tokenPriorityComparator(a: Token, b: Token): number {
  const weightA = PRIORITY_WEIGHTS[a.priority] || 0;
  const weightB = PRIORITY_WEIGHTS[b.priority] || 0;

  if (weightA !== weightB) {
    return weightB - weightA; // Higher weight comes first
  }
  return a.bookingTime - b.bookingTime; // Earlier arrival comes first
}

/**
 * Circular Queue implementation demonstrating fixed buffer memory reuse
 * Fixed size, front & rear pointers, overflow & underflow handling with modulo arithmetic
 */
export class CircularQueue<T> {
  private buffer: (T | null)[];
  private capacity: number;
  private head: number = 0;
  private tail: number = 0;
  private count: number = 0;

  constructor(capacity: number = 6) {
    this.capacity = capacity;
    this.buffer = new Array(capacity).fill(null);
  }

  enqueue(item: T): { success: boolean; error?: string } {
    if (this.isFull()) {
      return { success: false, error: 'Queue Overflow: circular buffer is full.' };
    }
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;
    this.count++;
    return { success: true };
  }

  dequeue(): { success: boolean; item?: T; error?: string } {
    if (this.isEmpty()) {
      return { success: false, error: 'Queue Underflow: circular buffer is empty.' };
    }
    const item = this.buffer[this.head];
    this.buffer[this.head] = null;
    this.head = (this.head + 1) % this.capacity;
    this.count--;
    return { success: true, item: item as T };
  }

  peek(): T | null {
    if (this.isEmpty()) return null;
    return this.buffer[this.head];
  }

  isEmpty(): boolean {
    return this.count === 0;
  }

  isFull(): boolean {
    return this.count === this.capacity;
  }

  size(): number {
    return this.count;
  }

  getCapacity(): number {
    return this.capacity;
  }

  getHead(): number {
    return this.head;
  }

  getTail(): number {
    return this.tail;
  }

  getSlots(): { index: number; value: T | null; isHead: boolean; isTail: boolean }[] {
    return this.buffer.map((val, idx) => ({
      index: idx,
      value: val,
      isHead: this.count > 0 && idx === this.head,
      isTail: idx === this.tail,
    }));
  }

  clear(): void {
    this.buffer = new Array(this.capacity).fill(null);
    this.head = 0;
    this.tail = 0;
    this.count = 0;
  }
}

/**
 * Smart Waiting-Time Estimator & Counter Allocation Algorithm
 * Formula:
 * W = R_curr + (N_ahead * S_avg)
 * where:
 * - R_curr: Remaining service time of the currently served token (0 if none)
 * - N_ahead: Number of people waiting ahead in the counter's queue
 * - S_avg: Average observed service duration of this specific counter in seconds
 * Tie-breaker: Shortest queue length N_ahead, then lowest counterNumber.
 */
export function calculateCounterWaitTime(
  counter: ServiceCounter,
  waitingTokensForCounter: Token[],
  currentTimeMs: number = Date.now()
): {
  estimatedSeconds: number;
  remainingCurrentSeconds: number;
  queueLength: number;
  avgDurationSeconds: number;
} {
  const avgDurationSeconds = counter.avgServiceDurationSeconds || 240;
  let remainingCurrentSeconds = 0;

  if (counter.currentlyServingTokenId && counter.servingStartedAt) {
    const elapsedSeconds = Math.max(0, Math.floor((currentTimeMs - counter.servingStartedAt) / 1000));
    remainingCurrentSeconds = Math.max(0, avgDurationSeconds - elapsedSeconds);
  }

  const queueLength = waitingTokensForCounter.length;
  const estimatedSeconds = remainingCurrentSeconds + queueLength * avgDurationSeconds;

  return {
    estimatedSeconds,
    remainingCurrentSeconds,
    queueLength,
    avgDurationSeconds,
  };
}

export function recommendBestCounter(
  counters: ServiceCounter[],
  allTokens: Token[],
  userPriority: PriorityLevel = 'NORMAL'
): {
  bestCounter: ServiceCounter | null;
  estimatedWaitSeconds: number;
  estimatedWaitMinutes: number;
  queueLength: number;
  reason: string;
  evaluations: Array<{
    counter: ServiceCounter;
    estimatedSeconds: number;
    queueLength: number;
    remainingCurrentSeconds: number;
    isOptimal: boolean;
  }>;
} {
  // Filter eligible counters: must be OPEN or BUSY (not CLOSED or PAUSED)
  const eligible = counters.filter(c => c.status === 'OPEN' || c.status === 'BUSY');

  if (eligible.length === 0) {
    return {
      bestCounter: null,
      estimatedWaitSeconds: 0,
      estimatedWaitMinutes: 0,
      queueLength: 0,
      reason: 'No operational counters available right now.',
      evaluations: [],
    };
  }

  // If user has special priority and there is a designated priority counter, prefer priority-eligible
  let candidates = eligible;
  if (userPriority !== 'NORMAL') {
    const priorityEligible = eligible.filter(c => c.isPriorityEligible);
    if (priorityEligible.length > 0) {
      candidates = priorityEligible;
    }
  }

  const evaluations = candidates.map(counter => {
    const counterTokens = allTokens.filter(
      t => t.counterId === counter.id && (t.status === 'WAITING' || t.status === 'CALLED')
    );
    const { estimatedSeconds, remainingCurrentSeconds, queueLength } = calculateCounterWaitTime(
      counter,
      counterTokens
    );

    return {
      counter,
      estimatedSeconds,
      remainingCurrentSeconds,
      queueLength,
      isOptimal: false,
    };
  });

  // Sort by estimatedSeconds ascending; tie break by queueLength ascending; then counterNumber ascending
  evaluations.sort((a, b) => {
    if (a.estimatedSeconds !== b.estimatedSeconds) {
      return a.estimatedSeconds - b.estimatedSeconds;
    }
    if (a.queueLength !== b.queueLength) {
      return a.queueLength - b.queueLength;
    }
    return a.counter.counterNumber - b.counter.counterNumber;
  });

  if (evaluations.length > 0) {
    evaluations[0].isOptimal = true;
    const best = evaluations[0];
    const waitMins = Math.ceil(best.estimatedSeconds / 60);
    const reason = `Optimal choice: ${best.counter.name} has the lowest estimated wait (~${waitMins} min) based on service velocity (${Math.round(best.counter.avgServiceDurationSeconds / 60)}m avg) and current queue (${best.queueLength} ahead).`;

    return {
      bestCounter: best.counter,
      estimatedWaitSeconds: best.estimatedSeconds,
      estimatedWaitMinutes: waitMins,
      queueLength: best.queueLength,
      reason,
      evaluations,
    };
  }

  return {
    bestCounter: null,
    estimatedWaitSeconds: 0,
    estimatedWaitMinutes: 0,
    queueLength: 0,
    reason: 'Unable to evaluate counters.',
    evaluations: [],
  };
}

/**
 * Educational Sorting Step Representation for DSA Lab
 */
export interface SortStep<T> {
  stepNumber: number;
  description: string;
  arrayState: T[];
  highlightedIndices: number[];
}

export function generateQuickSortSteps(arr: number[]): SortStep<number>[] {
  const steps: SortStep<number>[] = [];
  const arrayCopy = [...arr];

  steps.push({
    stepNumber: 0,
    description: 'Initial unsorted wait-time array across counters',
    arrayState: [...arrayCopy],
    highlightedIndices: [],
  });

  function partition(low: number, high: number): number {
    const pivot = arrayCopy[high];
    let i = low - 1;

    for (let j = low; j < high; j++) {
      if (arrayCopy[j] < pivot) {
        i++;
        const temp = arrayCopy[i];
        arrayCopy[i] = arrayCopy[j];
        arrayCopy[j] = temp;
      }
    }
    const temp = arrayCopy[i + 1];
    arrayCopy[i + 1] = arrayCopy[high];
    arrayCopy[high] = temp;

    steps.push({
      stepNumber: steps.length,
      description: `Partitioned around pivot ${pivot}. Placed at index ${i + 1}.`,
      arrayState: [...arrayCopy],
      highlightedIndices: [i + 1],
    });

    return i + 1;
  }

  function quickSort(low: number, high: number) {
    if (low < high) {
      const pi = partition(low, high);
      quickSort(low, pi - 1);
      quickSort(pi + 1, high);
    }
  }

  quickSort(0, arrayCopy.length - 1);

  steps.push({
    stepNumber: steps.length,
    description: 'Sorting complete: Counters ordered by ascending estimated waiting time (O(N log N)).',
    arrayState: [...arrayCopy],
    highlightedIndices: arrayCopy.map((_, i) => i),
  });

  return steps;
}
