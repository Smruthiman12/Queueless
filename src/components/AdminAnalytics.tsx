/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Facility, ServiceCounter, Token, User } from '../types/queue';
import { queueStore } from '../services/storage';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { BarChart3, TrendingUp, Users, Clock, Plus, CheckCircle, Shield, Settings2 } from 'lucide-react';

interface AdminAnalyticsProps {
  facilities: Facility[];
  tokens: Token[];
  currentUser: User;
}

export const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({
  facilities,
  tokens,
  currentUser,
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'today' | 'week'>('today');
  const [editingCounterId, setEditingCounterId] = useState<string | null>(null);

  // Compute aggregate system metrics
  const allCounters = facilities.flatMap((f) => f.counters);
  const totalServedAcrossCampus = allCounters.reduce((acc, c) => acc + (c.totalServedToday || 0), 0);
  const totalWaiting = tokens.filter((t) => t.status === 'WAITING' || t.status === 'CALLED').length;

  const avgServiceSpeedSeconds = Math.round(
    allCounters.reduce((acc, c) => acc + c.avgServiceDurationSeconds, 0) / (allCounters.length || 1)
  );

  // Chart 1: Peak-Hour Hourly Traffic & Queue Length Data
  const hourlyQueueData = [
    { hour: '08:00', students: 12, waitMin: 4 },
    { hour: '09:00', students: 34, waitMin: 8 },
    { hour: '10:00', students: 68, waitMin: 14 },
    { hour: '11:00', students: 85, waitMin: 18 },
    { hour: '12:00', students: 142, waitMin: 22 }, // Lunch peak at canteen
    { hour: '13:00', students: 135, waitMin: 20 },
    { hour: '14:00', students: 78, waitMin: 12 },
    { hour: '15:00', students: 54, waitMin: 9 },
    { hour: '16:00', students: 42, waitMin: 6 },
    { hour: '17:00', students: 25, waitMin: 5 },
  ];

  // Chart 2: Counter Performance Comparison (Served vs Avg Time)
  const counterPerformanceData = allCounters.map((c) => ({
    name: c.name.length > 18 ? c.name.substring(0, 15) + '...' : c.name,
    served: c.totalServedToday,
    durationMins: Number((c.avgServiceDurationSeconds / 60).toFixed(1)),
  }));

  // Chart 3: Facility Distribution
  const facilityDistributionData = facilities.map((f) => {
    const served = f.counters.reduce((acc, c) => acc + c.totalServedToday, 0);
    return {
      name: f.name.replace(' Counter', '').replace(' Office', ''),
      value: served || 5,
    };
  });

  const PIE_COLORS = ['#0f766e', '#0369a1', '#4338ca', '#b45309', '#be123c'];

  const toggleCounterStatus = (counterId: string) => {
    const counter = queueStore.getCounterById(counterId);
    if (!counter) return;
    const nextStatus = counter.status === 'OPEN' ? 'PAUSED' : counter.status === 'PAUSED' ? 'OPEN' : 'OPEN';
    queueStore.updateCounter(counterId, { status: nextStatus });
  };

  const togglePriorityEligibility = (counterId: string, currentVal: boolean) => {
    queueStore.updateCounter(counterId, { isPriorityEligible: !currentVal });
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Administration & Dean of Student Affairs Console</span>
            <span>·</span>
            <span>Campus Overview</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Queue Intelligence & Analytics
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Real-time throughput, wait-time distribution, and counter load across campus.
          </p>
        </div>

        {/* Timeframe Filter */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs font-medium">
          <button
            onClick={() => setSelectedTimeframe('today')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              selectedTimeframe === 'today' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Today (Live)
          </button>
          <button
            onClick={() => setSelectedTimeframe('week')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              selectedTimeframe === 'week' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            This Week
          </button>
        </div>
      </div>

      {/* High-Level Metric Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-slate-400 font-medium">Total Students Served</p>
          <p className="text-3xl font-black font-mono tabular-nums text-slate-900 mt-1">
            {totalServedAcrossCampus}
          </p>
          <p className="text-[11px] text-teal-700 font-medium mt-1">↑ 22% vs yesterday</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-slate-400 font-medium">Average Campus Wait</p>
          <p className="text-3xl font-black font-mono tabular-nums text-teal-800 mt-1">
            7.4 <span className="text-sm font-normal text-slate-500">min</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Down from 28m physical queue</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-slate-400 font-medium">Avg Service Duration</p>
          <p className="text-3xl font-black font-mono tabular-nums text-slate-900 mt-1">
            {Math.round(avgServiceSpeedSeconds / 60)}:{(avgServiceSpeedSeconds % 60).toString().padStart(2, '0')}{' '}
            <span className="text-sm font-normal text-slate-500">min</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Across 10 active counters</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-slate-400 font-medium">Live Students Waiting</p>
          <p className="text-3xl font-black font-mono tabular-nums text-slate-900 mt-1">
            {totalWaiting}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Distributed dynamically</p>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Peak Hour Traffic (AreaChart) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Peak Hour Load & Wait Times</h3>
              <p className="text-xs text-slate-500">Student arrival volume vs average wait duration</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">10:00 - 14:00 Peak</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyQueueData}>
                <defs>
                  <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f766e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0f766e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="students"
                  name="Students Arrived"
                  stroke="#0f766e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorStudents)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Facility Traffic Breakdown (PieChart) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Facility Traffic Share</h3>
            <p className="text-xs text-slate-500">Share of served students by campus center</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={facilityDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {facilityDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', color: '#64748b' }}
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[11px] text-slate-400 text-center">
            Canteen accounts for ~45% of peak campus queue volume.
          </p>
        </div>
      </div>

      {/* Chart 3: Counter Throughput vs Speed */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Counter Throughput vs Service Speed</h3>
            <p className="text-xs text-slate-500">Students served today across all campus counters</p>
          </div>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={counterPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="served" name="Students Served" fill="#0f766e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Facilities & Counter Administration Manager */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Campus Facilities & Service Desks Control</h3>
            <p className="text-xs text-slate-500">
              Configure counter operating status, staff assignments, and priority accessibility rules.
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {facilities.map((facility) => (
            <div key={facility.id} className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{facility.name}</h4>
                  <p className="text-xs text-slate-500">
                    {facility.location} · {facility.operatingHours}
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-600">
                  {facility.counters.length} Desks Configured
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {facility.counters.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 text-xs flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{c.name}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            c.status === 'OPEN'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.status === 'BUSY'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">Staff: {c.staffName || 'Unassigned'}</p>
                      <p className="text-[11px] text-slate-500">
                        Velocity: {Math.round(c.avgServiceDurationSeconds / 60)}m/student · Served: {c.totalServedToday}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                      <button
                        onClick={() => togglePriorityEligibility(c.id, c.isPriorityEligible)}
                        className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                          c.isPriorityEligible
                            ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                      >
                        {c.isPriorityEligible ? 'Priority: ON' : 'Priority: OFF'}
                      </button>

                      <button
                        onClick={() => toggleCounterStatus(c.id)}
                        className="px-2.5 py-1 bg-slate-900 text-white rounded text-[10px] font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        {c.status === 'PAUSED' ? 'Resume Desk' : 'Pause Desk'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
