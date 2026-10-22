/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'student' | 'staff' | 'admin';

export type PriorityLevel = 'NORMAL' | 'ACCESSIBLE' | 'EMERGENCY' | 'FACULTY_REFERRAL';

export type TokenStatus = 'WAITING' | 'CALLED' | 'SERVING' | 'COMPLETED' | 'CANCELLED' | 'SKIPPED';

export type CounterStatus = 'OPEN' | 'BUSY' | 'PAUSED' | 'CLOSED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  studentId?: string;
  department?: string;
  phone?: string;
  assignedCounterId?: string;
}

export interface ServiceCounter {
  id: string;
  facilityId: string;
  name: string; // e.g. "Counter A", "Express Checkout"
  counterNumber: number;
  status: CounterStatus;
  staffName?: string;
  avgServiceDurationSeconds: number; // e.g. 240 = 4 mins
  currentlyServingTokenId?: string;
  servingStartedAt?: number; // epoch ms
  totalServedToday: number;
  isPriorityEligible: boolean;
  priorityOnly?: boolean;
}

export interface Facility {
  id: string;
  name: string; // "College Canteen", "Library Counter", "Administration Office", etc.
  category: 'canteen' | 'library' | 'admin' | 'fees' | 'laboratory' | 'health';
  description: string;
  location: string;
  operatingHours: string;
  imageUrl?: string;
  isActive: boolean;
  counters: ServiceCounter[];
}

export interface Token {
  id: string;
  tokenNumber: string; // e.g. "CAN-101", "LIB-204"
  facilityId: string;
  counterId: string;
  studentId: string;
  studentName: string;
  studentRollNo: string;
  priority: PriorityLevel;
  priorityReason?: string;
  status: TokenStatus;
  bookingTime: number; // epoch ms
  calledTime?: number;
  servedStartTime?: number;
  completedTime?: number;
  estimatedWaitMinutes: number;
  positionInQueue: number;
  qrPayload?: string;
  notes?: string;
}

export interface QueueEvent {
  id: string;
  tokenId: string;
  tokenNumber: string;
  counterId: string;
  eventType: 'BOOKED' | 'CALLED' | 'SERVING' | 'COMPLETED' | 'SKIPPED' | 'CANCELLED' | 'PAUSED';
  timestamp: number;
  actor: string;
  details?: string;
}

export interface InAppNotification {
  id: string;
  userId: string;
  tokenId?: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'turn_near' | 'turn_now' | 'completed' | 'pause';
  read: boolean;
  createdAt: number;
}

export interface CounterRecommendation {
  bestCounter: ServiceCounter;
  estimatedWaitSeconds: number;
  estimatedWaitMinutes: number;
  queueLength: number;
  reason: string;
  allEligibleCounters: {
    counter: ServiceCounter;
    estimatedWaitSeconds: number;
    queueLength: number;
    isOptimal: boolean;
  }[];
}
