'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import MobileNav from '../../components/MobileNav';
import Card, { CardContent, CardHeader, CardTitle } from '../../components/Card';
import { getDashboard, getRent } from '../../lib/api';
import { cn, statusStyles } from '../../lib/utils';
import {
  Building2,
  Users,
  Wallet,
  TrendingUp,
  TrendingDown,
  Zap,
  Receipt,
  Sparkles,
  CalendarDays,
} from 'lucide-react';
import { monthLabel, currentMonth } from '../../lib/utils';

const inr = (value) => `₹${(value ?? 0).toLocaleString()}`;

export default function DashboardPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState(null);
  const [recentPayments, setRecentPayments] = useState([]);
  const [pendingRents, setPendingRents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const [dashboardData, rentData] = await Promise.all([
        getDashboard(),
        getRent()
      ]);

      setDashboard(dashboardData);

      const recent = rentData
        .filter(r => r.paymentDate)
        .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
        .slice(0, 5);

      const pending = rentData.filter(r => r.status !== 'Paid');

      setRecentPayments(recent);
      setPendingRents(pending);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-5 py-4 text-sm font-medium text-slate-500 shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-400">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          Loading dashboard…
        </div>
      </div>
    );
  }

  const expectedRent = dashboard?.expectedRent ?? 0;
  const collectedRent = dashboard?.collectedRent ?? 0;
  const collectionRate =
    expectedRent > 0 ? Math.min(100, Math.round((collectedRent / expectedRent) * 100)) : 0;

  const stats = [
    {
      label: 'Expected Rent',
      value: inr(expectedRent),
      icon: Wallet,
      tone: 'from-emerald-500 to-teal-500 shadow-emerald-500/25',
      hint: 'Billed this month',
    },
    {
      label: 'Collected Rent',
      value: inr(collectedRent),
      icon: TrendingUp,
      tone: 'from-sky-500 to-cyan-500 shadow-sky-500/25',
      hint: `${collectionRate}% of expected`,
    },
    {
      label: 'Pending Rent',
      value: inr(dashboard?.pendingRent),
      icon: TrendingDown,
      tone: 'from-rose-500 to-orange-500 shadow-rose-500/25',
      hint: `${pendingRents.length} open ${pendingRents.length === 1 ? 'record' : 'records'}`,
    },
    {
      label: 'Electricity',
      value: inr(dashboard?.electricityExpense),
      icon: Zap,
      tone: 'from-amber-400 to-yellow-500 shadow-amber-500/25',
      hint: 'Units + other charges',
    },
  ];

  const summary = [
    {
      label: 'Total Properties',
      value: dashboard?.totalProperties ?? 0,
      icon: Building2,
      tone: 'from-emerald-500 to-teal-500 shadow-emerald-500/25',
    },
    {
      label: 'Total Rooms',
      value: dashboard?.totalRooms ?? 0,
      icon: Users,
      tone: 'from-sky-500 to-cyan-500 shadow-sky-500/25',
    },
    {
      label: 'Other Expenses',
      value: inr(dashboard?.otherExpenses),
      icon: Receipt,
      tone: 'from-violet-500 to-purple-500 shadow-violet-500/25',
    },
  ];

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="pb-24 md:ml-64 md:pb-10">
        <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          {/* Hero */}
          <section className="relative animate-fade-up overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-teal-600 p-6 text-white shadow-xl shadow-emerald-900/20 sm:p-8">
            <div
              aria-hidden="true"
              className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/15 blur-2xl"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-24 right-24 h-56 w-56 rounded-full bg-emerald-300/25 blur-3xl"
            />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ring-1 ring-inset ring-white/25">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {monthLabel(dashboard?.currentMonth || currentMonth())}
                </p>
                <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
                <p className="mt-1 max-w-md text-sm text-white/80">
                  Rent collection, occupancy and expenses at a glance.
                </p>
              </div>

              <div className="w-full max-w-sm rounded-2xl bg-white/10 p-4 ring-1 ring-inset ring-white/20 backdrop-blur-sm">
                <div className="flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-1.5 text-white/85">
                    <Sparkles className="h-4 w-4" />
                    Collection rate
                  </span>
                  <span className="font-semibold">{collectionRate}%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/25">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-700"
                    style={{ width: `${collectionRate}%` }}
                  />
                </div>
                <p className="mt-3 text-xs text-white/80">
                  {inr(collectedRent)} collected of {inr(expectedRent)} expected
                </p>
              </div>
            </div>
          </section>

          {/* Headline stats */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <Card
                key={stat.label}
                className="animate-fade-up hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-900/5"
              >
                <CardContent className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      {stat.label}
                    </p>
                    <p className="mt-1 truncate text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{stat.hint}</p>
                  </div>
                  <span
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg',
                      stat.tone
                    )}
                  >
                    <stat.icon className="h-5 w-5" />
                  </span>
                </CardContent>
              </Card>
            ))}
          </section>

          {/* Portfolio summary */}
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {summary.map((item) => (
              <Card
                key={item.label}
                className="hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-900/5"
              >
                <CardContent className="flex items-center gap-4">
                  <span
                    className={cn(
                      'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg',
                      item.tone
                    )}
                  >
                    <item.icon className="h-6 w-6" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                      {item.value}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{item.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>

          {/* Activity */}
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Payments</CardTitle>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  {recentPayments.length}
                </span>
              </CardHeader>
              <CardContent>
                {recentPayments.length === 0 ? (
                  <div className="py-8 text-center">
                    <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500">
                      <TrendingUp className="h-6 w-6" />
                    </span>
                    <p className="text-sm text-slate-500 dark:text-slate-400">No recent payments</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentPayments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-emerald-50/70 dark:hover:bg-white/5"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                          {(payment.tenantName || 'V').charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {payment.tenantName || 'Vacant'}
                          </p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {payment.propertyName} · Room {payment.roomNumber}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                            {inr(payment.paidAmount)}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">
                            {payment.monthLabel || payment.month}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pending Rents</CardTitle>
                <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                  {pendingRents.length}
                </span>
              </CardHeader>
              <CardContent>
                {pendingRents.length === 0 ? (
                  <div className="py-8 text-center">
                    <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500">
                      <TrendingDown className="h-6 w-6" />
                    </span>
                    <p className="text-sm text-slate-500 dark:text-slate-400">No pending rents</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pendingRents.map((rent) => (
                      <div
                        key={rent.id}
                        className="flex items-center gap-3 rounded-xl bg-rose-50/70 p-3 ring-1 ring-inset ring-rose-100 dark:bg-rose-500/5 dark:ring-rose-400/15"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100 text-sm font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                          {(rent.tenantName || 'V').charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {rent.tenantName || 'Vacant'}
                          </p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {rent.propertyName} · Room {rent.roomNumber}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                            {inr(rent.remaining)}
                          </p>
                          <span
                            className={cn(
                              'mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset',
                              statusStyles(rent.status)
                            )}
                          >
                            {rent.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
