/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SPRING_BOOT_CONTROLLER_CODE, SPRING_BOOT_DSA_SERVICE_CODE } from '../services/backendArchitecture';
import { Database, Server, Cpu, KeyRound, Copy, Check, FileCode, Smartphone } from 'lucide-react';

export const ArchitectureDocs: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'mysql' | 'springboot' | 'dsa' | 'credentials' | 'mobile'>('mysql');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const sampleSqlSnippet = `-- 10 Normalized MySQL Tables with Foreign Keys & Indexes
-- 1. users
-- 2. student_profiles
-- 3. staff_profiles
-- 4. facilities
-- 5. operating_schedules
-- 6. service_counters
-- 7. tokens
-- 8. queue_events (Audit log)
-- 9. service_records (Durations & Analytics)
-- 10. notifications

CREATE TABLE service_counters (
    id VARCHAR(36) PRIMARY KEY,
    facility_id VARCHAR(36) NOT NULL,
    counter_number INT NOT NULL,
    counter_name VARCHAR(100) NOT NULL,
    assigned_staff_id VARCHAR(36),
    status ENUM('OPEN', 'BUSY', 'PAUSED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    avg_service_duration_seconds INT NOT NULL DEFAULT 240,
    is_priority_eligible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_counter_facility FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE,
    UNIQUE KEY uq_facility_counter (facility_id, counter_number)
) ENGINE=InnoDB;

CREATE TABLE tokens (
    id VARCHAR(36) PRIMARY KEY,
    token_number VARCHAR(32) NOT NULL,
    facility_id VARCHAR(36) NOT NULL,
    counter_id VARCHAR(36) NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    priority ENUM('NORMAL', 'ACCESSIBLE', 'EMERGENCY', 'FACULTY_REFERRAL') NOT NULL DEFAULT 'NORMAL',
    status ENUM('WAITING', 'CALLED', 'SERVING', 'COMPLETED', 'CANCELLED', 'SKIPPED') NOT NULL DEFAULT 'WAITING',
    booking_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estimated_wait_minutes INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_token_facility FOREIGN KEY (facility_id) REFERENCES facilities(id),
    CONSTRAINT fk_token_counter FOREIGN KEY (counter_id) REFERENCES service_counters(id),
    CONSTRAINT fk_token_student FOREIGN KEY (student_id) REFERENCES users(id),
    INDEX idx_counter_status (counter_id, status)
) ENGINE=InnoDB;`;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
          <span>Engineering Specifications</span>
          <span>·</span>
          <span>Viva & College Presentation Reference</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          QueueLess System Architecture
        </h1>
        <p className="text-xs text-slate-600 mt-0.5">
          Complete documentation of relational database schemas, Java Spring Boot microservices, DSA complexities, and cross-platform mobile specs.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-2 text-xs font-semibold">
        {[
          { id: 'mysql', label: 'MySQL Database Schema (10 Tables)', icon: Database },
          { id: 'springboot', label: 'Java Spring Boot REST & WebSocket', icon: Server },
          { id: 'dsa', label: 'DSA Complexity & Formulations', icon: Cpu },
          { id: 'credentials', label: 'Demo Roles & Test Credentials', icon: KeyRound },
          { id: 'mobile', label: 'React Native / Expo Architecture', icon: Smartphone },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as typeof activeSection)}
              className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeSection === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION 1: MYSQL */}
      {activeSection === 'mysql' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Normalized Relational Schema (MySQL 8.0+ / InnoDB)
                </h3>
                <p className="text-xs text-slate-500">
                  Designed in 3rd Normal Form (3NF) to guarantee transactional integrity and prevent duplicate booking conflicts.
                </p>
              </div>

              <button
                onClick={() => handleCopy(sampleSqlSnippet, 'sql')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {copiedKey === 'sql' ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'sql' ? 'Copied' : 'Copy DDL'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              {[
                { name: 'users', desc: 'Core Auth & Roles' },
                { name: 'student_profiles', desc: 'Roll # & Accessibility' },
                { name: 'staff_profiles', desc: 'Employee Code & Desk' },
                { name: 'facilities', desc: 'Campus Buildings' },
                { name: 'operating_schedules', desc: 'Hours & Breaks' },
                { name: 'service_counters', desc: 'Active Desks & Status' },
                { name: 'tokens', desc: 'Digital Queue Tickets' },
                { name: 'queue_events', desc: 'Audit Log Trail' },
                { name: 'service_records', desc: 'Historical Analytics' },
                { name: 'notifications', desc: 'In-app & Push Queue' },
              ].map((table) => (
                <div key={table.name} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="font-mono font-bold text-slate-900">{table.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{table.desc}</p>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto max-h-96">
              <pre>{sampleSqlSnippet}</pre>
            </div>
            <p className="text-xs text-slate-500">
              * Complete production script saved in project at <code className="text-slate-800 font-mono font-bold">/src/services/schema.sql</code>.
            </p>
          </div>
        </div>
      )}

      {/* SECTION 2: SPRING BOOT */}
      {activeSection === 'springboot' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Java Spring Boot Backend Architecture
            </h3>
            <p className="text-xs text-slate-500">
              Controller, Service layer, in-memory Java Collection synchronizer, and WebSocket publisher.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                  <span>QueueManagementController.java</span>
                  <button
                    onClick={() => handleCopy(SPRING_BOOT_CONTROLLER_CODE, 'ctrl')}
                    className="text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'ctrl' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'ctrl' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto max-h-80">
                  <pre>{SPRING_BOOT_CONTROLLER_CODE.trim()}</pre>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                  <span>QueueOptimizationService.java (DSA Engine)</span>
                  <button
                    onClick={() => handleCopy(SPRING_BOOT_DSA_SERVICE_CODE, 'srv')}
                    className="text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'srv' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'srv' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto max-h-80">
                  <pre>{SPRING_BOOT_DSA_SERVICE_CODE.trim()}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: DSA */}
      {activeSection === 'dsa' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-slate-900">
              Data Structures & Complexity Breakdown
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                  <tr>
                    <th className="py-3 px-4">Data Structure</th>
                    <th className="py-3 px-4">Java Collection</th>
                    <th className="py-3 px-4">Primary Operations</th>
                    <th className="py-3 px-4">Time Complexity</th>
                    <th className="py-3 px-4">QueueLess Application</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900">Normal FIFO Queue</td>
                    <td className="py-3 px-4 text-teal-800">java.util.ArrayDeque</td>
                    <td className="py-3 px-4">offer(), poll(), peek()</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">O(1) amortized</td>
                    <td className="py-3 px-4 font-sans text-slate-600">Standard student queue order</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900">Priority Queue</td>
                    <td className="py-3 px-4 text-teal-800">java.util.PriorityQueue</td>
                    <td className="py-3 px-4">offer(), poll()</td>
                    <td className="py-3 px-4 font-bold text-teal-700">O(log N)</td>
                    <td className="py-3 px-4 font-sans text-slate-600">Accessibility & Emergency cases</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900">Circular Buffer</td>
                    <td className="py-3 px-4 text-teal-800">Fixed Array Buffer</td>
                    <td className="py-3 px-4">enqueue(), dequeue()</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">O(1)</td>
                    <td className="py-3 px-4 font-sans text-slate-600">Temporary socket memory reuse</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900">Counter Sorter</td>
                    <td className="py-3 px-4 text-teal-800">QuickSort / TimSort</td>
                    <td className="py-3 px-4">sort(comparator)</td>
                    <td className="py-3 px-4 font-bold text-blue-700">O(N log N)</td>
                    <td className="py-3 px-4 font-sans text-slate-600">Ranking counters by lowest wait time</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl text-xs text-slate-700 space-y-2">
              <h4 className="font-bold text-teal-900">
                Waiting-Time Mathematical Formulation
              </h4>
              <p className="font-mono bg-white p-2 rounded border border-teal-200 text-teal-950">
                W = max(0, S_avg - (t_now - t_servedStart)) + (N_ahead × S_avg)
              </p>
              <p className="leading-relaxed">
                If no student is currently in service, the remaining time is zero. When students complete service, the rolling average is updated via an exponential moving average (EMA) to adapt to peak hour slowdowns.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: CREDENTIALS */}
      {activeSection === 'credentials' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Demo Roles & Pre-Seeded Test Credentials
            </h3>
            <p className="text-xs text-slate-500">
              You can instantly switch between all three roles using the switcher in the top navigation bar.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                  STUDENT ROLE
                </span>
                <p className="font-bold text-slate-900 text-sm">Alex Rivera</p>
                <div className="space-y-1 font-mono text-[11px] text-slate-600">
                  <p>Email: alex.rivera@campus.edu</p>
                  <p>Roll No: 2024CS108</p>
                  <p>Dept: Computer Science</p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                  STAFF ROLE
                </span>
                <p className="font-bold text-slate-900 text-sm">Sarah Jenkins</p>
                <div className="space-y-1 font-mono text-[11px] text-slate-600">
                  <p>Email: sarah.canteen@campus.edu</p>
                  <p>Counter: Counter A (Thali)</p>
                  <p>Dept: Dining Services</p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <span className="text-[10px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                  ADMINISTRATOR ROLE
                </span>
                <p className="font-bold text-slate-900 text-sm">Dr. Robert Chen</p>
                <div className="space-y-1 font-mono text-[11px] text-slate-600">
                  <p>Email: admin@queueless.edu</p>
                  <p>Role: Dean of Student Affairs</p>
                  <p>Permission: Full Campus Access</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: MOBILE */}
      {activeSection === 'mobile' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              React Native with Expo Mobile Architecture
            </h3>
            <p className="text-xs text-slate-500">
              QueueLess shares the exact same REST API, WebSocket pub-sub channels, and typography tokens across iOS, Android, and web.
            </p>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-3">
              <h4 className="font-bold text-slate-900">Native Mobile Stack Components:</h4>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li><strong>Navigation:</strong> React Navigation 7 bottom tab bar: Home, Services, My Token, Notifications, Profile.</li>
                <li><strong>Push Notifications:</strong> Expo Push Notifications with background queue position alerts when &le; 1 student ahead.</li>
                <li><strong>Haptics & Sound:</strong> Expo-Haptics feedback on token called and WebAudio synthetic chimes.</li>
                <li><strong>Offline Caching:</strong> AsyncStorage syncing with fallback periodic poll when WebSocket disconnects.</li>
              </ul>
              <p className="text-[11px] text-teal-800 font-semibold pt-1">
                Tip: Toggle the mobile preview icon in the top navigation bar to test the touch viewport!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
