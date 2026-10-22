/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CounterStatus, Facility, InAppNotification, PriorityLevel, QueueEvent, ServiceCounter, Token, User } from '../types/queue';
import { playTurnApproachingChime, playTurnCalledChime } from './audio';

const STORAGE_KEYS = {
  FACILITIES: 'queueless_facilities_v1',
  TOKENS: 'queueless_tokens_v1',
  USERS: 'queueless_users_v1',
  CURRENT_USER: 'queueless_current_user_v1',
  NOTIFICATIONS: 'queueless_notifications_v1',
  EVENTS: 'queueless_events_v1',
};

// Initial Seed Users
export const INITIAL_USERS: User[] = [
  {
    id: 'user-student-1',
    name: 'Alex Rivera',
    email: 'alex.rivera@campus.edu',
    role: 'student',
    studentId: '2024CS108',
    department: 'Computer Science & Engineering',
    phone: '+1 (555) 234-5678',
  },
  {
    id: 'user-staff-1',
    name: 'Sarah Jenkins',
    email: 'sarah.canteen@campus.edu',
    role: 'staff',
    department: 'Campus Dining Services',
    assignedCounterId: 'cnt-canteen-a',
    phone: '+1 (555) 345-6789',
  },
  {
    id: 'user-staff-2',
    name: 'David Miller',
    email: 'david.canteen@campus.edu',
    role: 'staff',
    department: 'Campus Dining Services',
    assignedCounterId: 'cnt-canteen-b',
    phone: '+1 (555) 345-6790',
  },
  {
    id: 'user-staff-3',
    name: 'Elena Vance',
    email: 'elena.canteen@campus.edu',
    role: 'staff',
    department: 'Campus Dining Services',
    assignedCounterId: 'cnt-canteen-c',
    phone: '+1 (555) 345-6791',
  },
  {
    id: 'user-admin-1',
    name: 'Dr. Robert Chen',
    email: 'admin@queueless.edu',
    role: 'admin',
    department: 'Dean of Student Affairs Office',
    phone: '+1 (555) 987-6543',
  },
];

// Initial Seed Facilities with Three-Counter Setup
export const INITIAL_FACILITIES: Facility[] = [
  {
    id: 'fac-canteen',
    name: 'College Canteen',
    category: 'canteen',
    description: 'Main campus dining hall serving meals, snacks, and beverage tokens.',
    location: 'Student Union Building, Ground Floor',
    operatingHours: '08:00 AM – 08:30 PM',
    imageUrl: '/src/assets/images/canteen_service_1792642223548.jpg',
    isActive: true,
    counters: [
      {
        id: 'cnt-canteen-a',
        facilityId: 'fac-canteen',
        name: 'Counter A (Hot Meals & Thali)',
        counterNumber: 1,
        status: 'BUSY',
        staffName: 'Sarah Jenkins',
        avgServiceDurationSeconds: 240, // 4 mins
        currentlyServingTokenId: 'tok-canteen-001',
        servingStartedAt: Date.now() - 90 * 1000,
        totalServedToday: 42,
        isPriorityEligible: true,
      },
      {
        id: 'cnt-canteen-b',
        facilityId: 'fac-canteen',
        name: 'Counter B (Express Snacks & Bowls)',
        counterNumber: 2,
        status: 'OPEN',
        staffName: 'David Miller',
        avgServiceDurationSeconds: 180, // 3 mins (Fastest!)
        currentlyServingTokenId: undefined,
        totalServedToday: 58,
        isPriorityEligible: true,
      },
      {
        id: 'cnt-canteen-c',
        facilityId: 'fac-canteen',
        name: 'Counter C (Beverages & Custom Orders)',
        counterNumber: 3,
        status: 'OPEN',
        staffName: 'Elena Vance',
        avgServiceDurationSeconds: 300, // 5 mins
        currentlyServingTokenId: 'tok-canteen-004',
        servingStartedAt: Date.now() - 40 * 1000,
        totalServedToday: 31,
        isPriorityEligible: false,
      },
    ],
  },
  {
    id: 'fac-library',
    name: 'Library Counter',
    category: 'library',
    description: 'Book issuance, returns, digital thesis access, and reference desk.',
    location: 'Central Library, 1st Floor East Wing',
    operatingHours: '08:30 AM – 09:00 PM',
    imageUrl: '/src/assets/images/library_desk_1792642223715.jpg',
    isActive: true,
    counters: [
      {
        id: 'cnt-lib-1',
        facilityId: 'fac-library',
        name: 'Circulation Desk 1 (Issuance)',
        counterNumber: 1,
        status: 'BUSY',
        staffName: 'Michael Brown',
        avgServiceDurationSeconds: 150, // 2.5 mins
        currentlyServingTokenId: 'tok-lib-001',
        servingStartedAt: Date.now() - 60 * 1000,
        totalServedToday: 64,
        isPriorityEligible: true,
      },
      {
        id: 'cnt-lib-2',
        facilityId: 'fac-library',
        name: 'Circulation Desk 2 (Returns & Clearance)',
        counterNumber: 2,
        status: 'OPEN',
        staffName: 'Emily Watson',
        avgServiceDurationSeconds: 120, // 2 mins
        currentlyServingTokenId: undefined,
        totalServedToday: 73,
        isPriorityEligible: true,
      },
    ],
  },
  {
    id: 'fac-admin',
    name: 'Administration Office',
    category: 'admin',
    description: 'Official student documents, bonafide certificates, identity cards, and verification.',
    location: 'Administrative Complex, Room 102',
    operatingHours: '09:00 AM – 05:00 PM',
    imageUrl: '/src/assets/images/admin_counter_1792642223541.jpg',
    isActive: true,
    counters: [
      {
        id: 'cnt-admin-1',
        facilityId: 'fac-admin',
        name: 'Registrar & Transcripts',
        counterNumber: 1,
        status: 'BUSY',
        staffName: 'Priya Sharma',
        avgServiceDurationSeconds: 360, // 6 mins
        currentlyServingTokenId: 'tok-adm-001',
        servingStartedAt: Date.now() - 120 * 1000,
        totalServedToday: 24,
        isPriorityEligible: true,
      },
      {
        id: 'cnt-admin-2',
        facilityId: 'fac-admin',
        name: 'Bonafide & ID Services',
        counterNumber: 2,
        status: 'OPEN',
        staffName: 'Marcus Hall',
        avgServiceDurationSeconds: 240, // 4 mins
        currentlyServingTokenId: undefined,
        totalServedToday: 29,
        isPriorityEligible: true,
      },
    ],
  },
  {
    id: 'fac-fees',
    name: 'Fee Payment Counter',
    category: 'fees',
    description: 'Semester fees, examination dues, scholarship clearance, and challan endorsements.',
    location: 'Finance Wing, Ground Floor',
    operatingHours: '09:30 AM – 04:30 PM',
    isActive: true,
    counters: [
      {
        id: 'cnt-fee-1',
        facilityId: 'fac-fees',
        name: 'Cash & Card Payments',
        counterNumber: 1,
        status: 'OPEN',
        staffName: 'Robert Walsh',
        avgServiceDurationSeconds: 240, // 4 mins
        currentlyServingTokenId: undefined,
        totalServedToday: 38,
        isPriorityEligible: true,
      },
      {
        id: 'cnt-fee-2',
        facilityId: 'fac-fees',
        name: 'Scholarships & Concessions',
        counterNumber: 2,
        status: 'OPEN',
        staffName: 'Anita Roy',
        avgServiceDurationSeconds: 300, // 5 mins
        currentlyServingTokenId: undefined,
        totalServedToday: 19,
        isPriorityEligible: true,
      },
    ],
  },
  {
    id: 'fac-lab',
    name: 'Laboratory Equipment Desk',
    category: 'laboratory',
    description: 'Component checkout, microcontrollers, oscilloscope kit issuance, and lab returns.',
    location: 'Turing Computing & Hardware Center, Lab 3',
    operatingHours: '08:30 AM – 05:30 PM',
    isActive: true,
    counters: [
      {
        id: 'cnt-lab-1',
        facilityId: 'fac-lab',
        name: 'Hardware Components & IoT Kits',
        counterNumber: 1,
        status: 'OPEN',
        staffName: 'Karthik Rao',
        avgServiceDurationSeconds: 200,
        currentlyServingTokenId: undefined,
        totalServedToday: 45,
        isPriorityEligible: false,
      },
    ],
  },
];

// Initial Seed Tokens
export const INITIAL_TOKENS: Token[] = [
  // Canteen Tokens
  {
    id: 'tok-canteen-001',
    tokenNumber: 'CAN-101',
    facilityId: 'fac-canteen',
    counterId: 'cnt-canteen-a',
    studentId: 'user-sim-1',
    studentName: 'Rohan Verma',
    studentRollNo: '2023CS012',
    priority: 'NORMAL',
    status: 'SERVING',
    bookingTime: Date.now() - 15 * 60 * 1000,
    calledTime: Date.now() - 2 * 60 * 1000,
    servedStartTime: Date.now() - 90 * 1000,
    estimatedWaitMinutes: 0,
    positionInQueue: 0,
    qrPayload: 'CAN-101|Rohan|cnt-canteen-a',
  },
  {
    id: 'tok-canteen-002',
    tokenNumber: 'CAN-102',
    facilityId: 'fac-canteen',
    counterId: 'cnt-canteen-a',
    studentId: 'user-sim-2',
    studentName: 'Meera Nair',
    studentRollNo: '2023EC045',
    priority: 'ACCESSIBLE',
    priorityReason: 'Medical / Mobility Assistance Pass',
    status: 'WAITING',
    bookingTime: Date.now() - 10 * 60 * 1000,
    estimatedWaitMinutes: 4,
    positionInQueue: 1,
    qrPayload: 'CAN-102|Meera|cnt-canteen-a',
  },
  {
    id: 'tok-canteen-003',
    tokenNumber: 'CAN-103',
    facilityId: 'fac-canteen',
    counterId: 'cnt-canteen-a',
    studentId: 'user-sim-3',
    studentName: 'Jason Todd',
    studentRollNo: '2024ME088',
    priority: 'NORMAL',
    status: 'WAITING',
    bookingTime: Date.now() - 7 * 60 * 1000,
    estimatedWaitMinutes: 8,
    positionInQueue: 2,
    qrPayload: 'CAN-103|Jason|cnt-canteen-a',
  },
  // Counter C active token
  {
    id: 'tok-canteen-004',
    tokenNumber: 'CAN-301',
    facilityId: 'fac-canteen',
    counterId: 'cnt-canteen-c',
    studentId: 'user-sim-4',
    studentName: 'Chloe Bennett',
    studentRollNo: '2024BT019',
    priority: 'NORMAL',
    status: 'SERVING',
    bookingTime: Date.now() - 12 * 60 * 1000,
    calledTime: Date.now() - 1 * 60 * 1000,
    servedStartTime: Date.now() - 40 * 1000,
    estimatedWaitMinutes: 0,
    positionInQueue: 0,
    qrPayload: 'CAN-301|Chloe|cnt-canteen-c',
  },
  // Library Tokens
  {
    id: 'tok-lib-001',
    tokenNumber: 'LIB-101',
    facilityId: 'fac-library',
    counterId: 'cnt-lib-1',
    studentId: 'user-sim-5',
    studentName: 'Aarav Patel',
    studentRollNo: '2022CS089',
    priority: 'NORMAL',
    status: 'SERVING',
    bookingTime: Date.now() - 8 * 60 * 1000,
    calledTime: Date.now() - 1 * 60 * 1000,
    servedStartTime: Date.now() - 60 * 1000,
    estimatedWaitMinutes: 0,
    positionInQueue: 0,
    qrPayload: 'LIB-101|Aarav|cnt-lib-1',
  },
  // Admin Token
  {
    id: 'tok-adm-001',
    tokenNumber: 'ADM-101',
    facilityId: 'fac-admin',
    counterId: 'cnt-admin-1',
    studentId: 'user-sim-6',
    studentName: 'Zoe Saldana',
    studentRollNo: '2021EE034',
    priority: 'NORMAL',
    status: 'SERVING',
    bookingTime: Date.now() - 14 * 60 * 1000,
    calledTime: Date.now() - 3 * 60 * 1000,
    servedStartTime: Date.now() - 120 * 1000,
    estimatedWaitMinutes: 0,
    positionInQueue: 0,
    qrPayload: 'ADM-101|Zoe|cnt-admin-1',
  },
];

// Initial Seed Notifications
export const INITIAL_NOTIFICATIONS: InAppNotification[] = [
  {
    id: 'notif-1',
    userId: 'user-student-1',
    title: 'Welcome to QueueLess',
    message: 'Explore campus facilities, check live waiting times, and book digital tokens in seconds.',
    type: 'info',
    read: false,
    createdAt: Date.now() - 60 * 60 * 1000,
  },
];

// Initial Events
export const INITIAL_EVENTS: QueueEvent[] = [
  {
    id: 'evt-1',
    tokenId: 'tok-canteen-001',
    tokenNumber: 'CAN-101',
    counterId: 'cnt-canteen-a',
    eventType: 'SERVING',
    timestamp: Date.now() - 90 * 1000,
    actor: 'Sarah Jenkins',
    details: 'Student being served at Counter A',
  },
];

type StoreListener = () => void;

class QueueStore {
  private listeners: Set<StoreListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.initStore();
      window.addEventListener('storage', () => {
        this.notify();
      });
    }
  }

  private initStore(): void {
    if (!localStorage.getItem(STORAGE_KEYS.FACILITIES)) {
      this.resetToDefaults();
    }
  }

  public resetToDefaults(): void {
    localStorage.setItem(STORAGE_KEYS.FACILITIES, JSON.stringify(INITIAL_FACILITIES));
    localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(INITIAL_TOKENS));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(INITIAL_USERS[0]));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(INITIAL_EVENTS));
    this.notify();
  }

  public subscribe(listener: StoreListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(cb => {
      try {
        cb();
      } catch (err) {
        console.error('Store listener error:', err);
      }
    });
  }

  // --- Users & Auth ---
  public getUsers(): User[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      return data ? JSON.parse(data) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  }

  public getCurrentUser(): User {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return data ? JSON.parse(data) : INITIAL_USERS[0];
    } catch {
      return INITIAL_USERS[0];
    }
  }

  public setCurrentUser(user: User): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    this.notify();
  }

  public switchUserRole(role: 'student' | 'staff' | 'admin'): User {
    const users = this.getUsers();
    let target = users.find(u => u.role === role);
    if (!target) {
      target = INITIAL_USERS.find(u => u.role === role) || INITIAL_USERS[0];
    }
    this.setCurrentUser(target);
    return target;
  }

  // --- Facilities & Counters ---
  public getFacilities(): Facility[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FACILITIES);
      return data ? JSON.parse(data) : INITIAL_FACILITIES;
    } catch {
      return INITIAL_FACILITIES;
    }
  }

  public updateFacility(updated: Facility): void {
    const facilities = this.getFacilities();
    const idx = facilities.findIndex(f => f.id === updated.id);
    if (idx !== -1) {
      facilities[idx] = updated;
    } else {
      facilities.push(updated);
    }
    localStorage.setItem(STORAGE_KEYS.FACILITIES, JSON.stringify(facilities));
    this.notify();
  }

  public getCounterById(counterId: string): ServiceCounter | undefined {
    const facilities = this.getFacilities();
    for (const f of facilities) {
      const found = f.counters.find(c => c.id === counterId);
      if (found) return found;
    }
    return undefined;
  }

  public updateCounter(counterId: string, updates: Partial<ServiceCounter>): void {
    const facilities = this.getFacilities();
    let updated = false;

    for (const f of facilities) {
      const idx = f.counters.findIndex(c => c.id === counterId);
      if (idx !== -1) {
        f.counters[idx] = { ...f.counters[idx], ...updates };
        updated = true;
        break;
      }
    }

    if (updated) {
      localStorage.setItem(STORAGE_KEYS.FACILITIES, JSON.stringify(facilities));
      this.notify();
    }
  }

  // --- Tokens ---
  public getTokens(): Token[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TOKENS);
      return data ? JSON.parse(data) : INITIAL_TOKENS;
    } catch {
      return INITIAL_TOKENS;
    }
  }

  public getTokenById(tokenId: string): Token | undefined {
    return this.getTokens().find(t => t.id === tokenId);
  }

  public getTokensForCounter(counterId: string): Token[] {
    return this.getTokens().filter(t => t.counterId === counterId);
  }

  public getWaitingTokensForCounter(counterId: string): Token[] {
    return this.getTokens().filter(
      t => t.counterId === counterId && (t.status === 'WAITING' || t.status === 'CALLED')
    );
  }

  public getTokensForStudent(studentId: string): Token[] {
    return this.getTokens().filter(t => t.studentId === studentId);
  }

  public getActiveTokenForStudent(studentId: string, facilityId?: string): Token | undefined {
    const tokens = this.getTokens();
    return tokens.find(
      t =>
        t.studentId === studentId &&
        (t.status === 'WAITING' || t.status === 'CALLED' || t.status === 'SERVING') &&
        (!facilityId || t.facilityId === facilityId)
    );
  }

  /**
   * Book a digital token. Enforces:
   * 1. No duplicate active token for same student and facility.
   * 2. Recalculates position and wait times.
   */
  public bookToken(params: {
    facilityId: string;
    counterId: string;
    student: User;
    priority: PriorityLevel;
    priorityReason?: string;
  }): { success: boolean; token?: Token; error?: string } {
    const activeToken = this.getActiveTokenForStudent(params.student.id, params.facilityId);
    if (activeToken) {
      return {
        success: false,
        error: `You already hold an active token (${activeToken.tokenNumber}) at this facility. Please complete or cancel it first.`,
      };
    }

    const facilities = this.getFacilities();
    const facility = facilities.find(f => f.id === params.facilityId);
    const counter = this.getCounterById(params.counterId);

    if (!facility || !counter) {
      return { success: false, error: 'Selected facility or service counter not found.' };
    }

    if (counter.status === 'CLOSED' || counter.status === 'PAUSED') {
      return {
        success: false,
        error: `Counter ${counter.name} is currently ${counter.status.toLowerCase()}. Please select another counter.`,
      };
    }

    const tokens = this.getTokens();
    const facilityTokens = tokens.filter(t => t.facilityId === params.facilityId);
    const prefix = facility.name.substring(0, 3).toUpperCase();
    const sequenceNumber = facilityTokens.length + 101;
    const tokenNumber = `${prefix}-${sequenceNumber}`;

    const waitingAtCounter = this.getWaitingTokensForCounter(params.counterId);
    const position = waitingAtCounter.length + 1;
    const avgDuration = counter.avgServiceDurationSeconds || 240;
    const estimatedWaitMinutes = Math.max(1, Math.ceil((position * avgDuration) / 60));

    const newToken: Token = {
      id: `tok-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tokenNumber,
      facilityId: params.facilityId,
      counterId: params.counterId,
      studentId: params.student.id,
      studentName: params.student.name,
      studentRollNo: params.student.studentId || '2024-CAMPUS',
      priority: params.priority,
      priorityReason: params.priorityReason,
      status: 'WAITING',
      bookingTime: Date.now(),
      estimatedWaitMinutes,
      positionInQueue: position,
      qrPayload: `QUEUES-${tokenNumber}-${counter.name}-${Date.now()}`,
    };

    tokens.push(newToken);
    localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokens));

    // Record Event
    this.recordEvent({
      tokenId: newToken.id,
      tokenNumber: newToken.tokenNumber,
      counterId: counter.id,
      eventType: 'BOOKED',
      actor: params.student.name,
      details: `Token booked at ${counter.name}. Priority: ${params.priority}`,
    });

    // In-app notification
    this.addNotification({
      userId: params.student.id,
      tokenId: newToken.id,
      title: 'Token Booked Successfully',
      message: `Your token ${newToken.tokenNumber} is confirmed for ${facility.name} (${counter.name}). Est. wait: ~${estimatedWaitMinutes} mins.`,
      type: 'info',
    });

    this.notify();
    return { success: true, token: newToken };
  }

  /**
   * Staff Action: Call Next Token
   */
  public callNextToken(counterId: string, staffName: string): { success: boolean; token?: Token; error?: string } {
    const counter = this.getCounterById(counterId);
    if (!counter) return { success: false, error: 'Counter not found.' };

    const waitingTokens = this.getWaitingTokensForCounter(counterId);
    if (waitingTokens.length === 0) {
      return { success: false, error: 'No waiting students in the queue for this counter.' };
    }

    // Sort using DSA Priority & Arrival comparator
    waitingTokens.sort((a, b) => {
      const pWeights: Record<PriorityLevel, number> = {
        EMERGENCY: 300,
        ACCESSIBLE: 200,
        FACULTY_REFERRAL: 100,
        NORMAL: 0,
      };
      const diff = (pWeights[b.priority] || 0) - (pWeights[a.priority] || 0);
      if (diff !== 0) return diff;
      return a.bookingTime - b.bookingTime;
    });

    const nextToken = waitingTokens[0];
    const tokens = this.getTokens();
    const tokenIdx = tokens.findIndex(t => t.id === nextToken.id);

    if (tokenIdx !== -1) {
      tokens[tokenIdx].status = 'CALLED';
      tokens[tokenIdx].calledTime = Date.now();
      tokens[tokenIdx].servedStartTime = Date.now();
      localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokens));
    }

    this.updateCounter(counterId, {
      currentlyServingTokenId: nextToken.id,
      servingStartedAt: Date.now(),
      status: 'BUSY',
    });

    this.recordEvent({
      tokenId: nextToken.id,
      tokenNumber: nextToken.tokenNumber,
      counterId,
      eventType: 'CALLED',
      actor: staffName,
      details: `Called to ${counter.name}`,
    });

    // Notify student
    this.addNotification({
      userId: nextToken.studentId,
      tokenId: nextToken.id,
      title: "It's Your Turn! Token Called",
      message: `Token ${nextToken.tokenNumber}: Please proceed immediately to ${counter.name}.`,
      type: 'turn_now',
    });

    // Sound chime
    playTurnCalledChime();

    // Check if next in line is near and notify them too
    if (waitingTokens.length > 1) {
      const upNext = waitingTokens[1];
      this.addNotification({
        userId: upNext.studentId,
        tokenId: upNext.id,
        title: 'You are Up Next!',
        message: `Token ${upNext.tokenNumber}: Only 1 student ahead of you at ${counter.name}. Please stay nearby.`,
        type: 'turn_near',
      });
      playTurnApproachingChime();
    }

    this.notify();
    return { success: true, token: tokens[tokenIdx] };
  }

  /**
   * Staff Action: Mark Current Token Served
   */
  public markServed(counterId: string, tokenId: string, staffName: string): { success: boolean; error?: string } {
    const counter = this.getCounterById(counterId);
    const tokens = this.getTokens();
    const tokenIdx = tokens.findIndex(t => t.id === tokenId);

    if (tokenIdx === -1) return { success: false, error: 'Token not found.' };

    const token = tokens[tokenIdx];
    const now = Date.now();
    token.status = 'COMPLETED';
    token.completedTime = now;

    // Calculate actual service duration and update rolling average
    let actualDurationSeconds = 180;
    if (token.servedStartTime) {
      actualDurationSeconds = Math.max(30, Math.floor((now - token.servedStartTime) / 1000));
    }

    if (counter) {
      const currentAvg = counter.avgServiceDurationSeconds || 240;
      const newTotalServed = (counter.totalServedToday || 0) + 1;
      // Exponential moving average: 80% old + 20% new
      const updatedAvg = Math.round(currentAvg * 0.8 + actualDurationSeconds * 0.2);

      this.updateCounter(counterId, {
        currentlyServingTokenId: undefined,
        servingStartedAt: undefined,
        status: 'OPEN',
        totalServedToday: newTotalServed,
        avgServiceDurationSeconds: updatedAvg,
      });
    }

    localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokens));

    this.recordEvent({
      tokenId: token.id,
      tokenNumber: token.tokenNumber,
      counterId,
      eventType: 'COMPLETED',
      actor: staffName,
      details: `Service completed in ${Math.round(actualDurationSeconds / 60)}m ${actualDurationSeconds % 60}s`,
    });

    this.addNotification({
      userId: token.studentId,
      tokenId: token.id,
      title: 'Service Completed',
      message: `Token ${token.tokenNumber}: Your service at ${counter?.name || 'Counter'} has been completed. Thank you!`,
      type: 'completed',
    });

    this.notify();
    return { success: true };
  }

  /**
   * Staff Action: Skip / Absent Token
   */
  public skipToken(counterId: string, tokenId: string, staffName: string): { success: boolean; error?: string } {
    const tokens = this.getTokens();
    const tokenIdx = tokens.findIndex(t => t.id === tokenId);

    if (tokenIdx === -1) return { success: false, error: 'Token not found.' };

    tokens[tokenIdx].status = 'SKIPPED';
    localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokens));

    this.updateCounter(counterId, {
      currentlyServingTokenId: undefined,
      servingStartedAt: undefined,
      status: 'OPEN',
    });

    this.recordEvent({
      tokenId: tokens[tokenIdx].id,
      tokenNumber: tokens[tokenIdx].tokenNumber,
      counterId,
      eventType: 'SKIPPED',
      actor: staffName,
      details: 'Student marked absent/skipped by staff',
    });

    this.notify();
    return { success: true };
  }

  /**
   * Student Action: Cancel Token
   */
  public cancelToken(tokenId: string, actorName: string): { success: boolean; error?: string } {
    const tokens = this.getTokens();
    const tokenIdx = tokens.findIndex(t => t.id === tokenId);

    if (tokenIdx === -1) return { success: false, error: 'Token not found.' };

    const token = tokens[tokenIdx];
    if (token.status === 'SERVING') {
      return { success: false, error: 'Cannot cancel a token that is currently being served.' };
    }

    tokens[tokenIdx].status = 'CANCELLED';
    localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokens));

    // If counter had this as currently serving or called
    const counter = this.getCounterById(token.counterId);
    if (counter && counter.currentlyServingTokenId === token.id) {
      this.updateCounter(counter.id, {
        currentlyServingTokenId: undefined,
        servingStartedAt: undefined,
        status: 'OPEN',
      });
    }

    this.recordEvent({
      tokenId: token.id,
      tokenNumber: token.tokenNumber,
      counterId: token.counterId,
      eventType: 'CANCELLED',
      actor: actorName,
      details: 'Token cancelled by student',
    });

    this.notify();
    return { success: true };
  }

  /**
   * Staff Action: Pause / Resume Counter
   */
  public toggleCounterPause(counterId: string, staffName: string): { success: boolean; newStatus: CounterStatus } {
    const counter = this.getCounterById(counterId);
    if (!counter) return { success: false, newStatus: 'CLOSED' };

    const newStatus: CounterStatus = counter.status === 'PAUSED' ? 'OPEN' : 'PAUSED';
    this.updateCounter(counterId, { status: newStatus });

    this.recordEvent({
      tokenId: 'SYSTEM',
      tokenNumber: 'SYSTEM',
      counterId,
      eventType: 'PAUSED',
      actor: staffName,
      details: `Counter status changed to ${newStatus}`,
    });

    // Notify waiting students if paused
    if (newStatus === 'PAUSED') {
      const waiting = this.getWaitingTokensForCounter(counterId);
      waiting.forEach(t => {
        this.addNotification({
          userId: t.studentId,
          tokenId: t.id,
          title: 'Counter Temporarily Paused',
          message: `${counter.name} is temporarily paused for staff break or maintenance. Estimated times may shift.`,
          type: 'pause',
        });
      });
    }

    this.notify();
    return { success: true, newStatus };
  }

  // --- Notifications ---
  public getNotifications(userId?: string): InAppNotification[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      const list: InAppNotification[] = data ? JSON.parse(data) : INITIAL_NOTIFICATIONS;
      return userId ? list.filter(n => n.userId === userId) : list;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  }

  public addNotification(notification: Omit<InAppNotification, 'id' | 'createdAt' | 'read'>): void {
    const list = this.getNotifications();
    const newNotif: InAppNotification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      createdAt: Date.now(),
      read: false,
    };
    list.unshift(newNotif);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list.slice(0, 50)));
    this.notify();
  }

  public markNotificationAsRead(id: string): void {
    const list = this.getNotifications();
    const idx = list.findIndex(n => n.id === id);
    if (idx !== -1) {
      list[idx].read = true;
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
      this.notify();
    }
  }

  public markAllNotificationsRead(userId: string): void {
    const list = this.getNotifications();
    list.forEach(n => {
      if (n.userId === userId) n.read = true;
    });
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
    this.notify();
  }

  // --- Events ---
  public getEvents(): QueueEvent[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EVENTS);
      return data ? JSON.parse(data) : INITIAL_EVENTS;
    } catch {
      return INITIAL_EVENTS;
    }
  }

  public recordEvent(event: Omit<QueueEvent, 'id' | 'timestamp'>): void {
    const events = this.getEvents();
    const newEvent: QueueEvent = {
      ...event,
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: Date.now(),
    };
    events.unshift(newEvent);
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events.slice(0, 100)));
  }
}

export const queueStore = new QueueStore();
