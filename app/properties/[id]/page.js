'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import MobileNav from '../../../components/MobileNav';
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/Card';
import Button from '../../../components/Button';
import Input, { Label, Textarea } from '../../../components/Input';
import Select from '../../../components/Select';
import Modal from '../../../components/Modal';
import {
  getProperties,
  updateProperty,
  deleteProperty,
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  createTenant,
  getTenants,
  moveOutTenant,
  tenantPhotoUrl,
  getRent,
  createRent,
  addRentPayment,
  getElectricity,
  createElectricity,
  getPreviousReading,
  getExpenses,
} from '../../../lib/api';
import { cn, statusStyles, currentMonth, monthLabel } from '../../../lib/utils';
import {
  Building2,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  ArrowLeft,
  DoorOpen,
  UserPlus,
  Wallet,
  Zap,
  Receipt,
  Users,
  IndianRupee,
  History,
  FileText,
  CalendarDays,
  ImageIcon,
} from 'lucide-react';

const inr = (value) => `₹${(value ?? 0).toLocaleString()}`;

const ROOM_CATEGORIES = ['REPAIR', 'MAINTENANCE', 'PLUMBING', 'ELECTRICAL', 'CLEANING', 'PAINTING', 'PROPERTY_TAX', 'OTHER'];

const emptyRoomForm = { roomNumber: '', floor: '', monthlyRent: '', securityDeposit: '', notes: '' };
const emptyTenantForm = { fullName: '', mobile: '', email: '', permanentAddress: '', occupation: '', joiningDate: '' };
const emptyPaymentForm = { amount: '', paymentDate: '', paymentMethod: 'CASH', referenceNumber: '', notes: '' };
const emptyExpenseForm = { description: '', category: 'REPAIR', amount: '', date: '', roomId: '', notes: '' };

/** Build a list of month strings between two "YYYY-MM" values (inclusive) */
const monthsBetween = (from, to) => {
  if (!from || !to) return [];
  let [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  const out = [];
  while (fy < ty || (fy === ty && fm <= tm)) {
    out.push(`${fy}-${String(fm).padStart(2, '0')}`);
    fm += 1;
    if (fm > 12) { fm = 1; fy += 1; }
    if (out.length > 60) break; // safety cap
  }
  return out;
};

const TABS = ['Rent History', 'Electricity Bills', 'Expenses'];

export default function PropertyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params?.id;

  const [property, setProperty] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [rentRecords, setRentRecords] = useState([]);
  const [readings, setReadings] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  /* -------- Property edit/delete -------- */
  const [propertyModal, setPropertyModal] = useState(false);
  const [propertyForm, setPropertyForm] = useState({ name: '', address: '', city: '', description: '' });

  /* -------- Room modal -------- */
  const [roomModal, setRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomForm, setRoomForm] = useState(emptyRoomForm);

  /* -------- Tenant modal -------- */
  const [tenantModal, setTenantModal] = useState(false);
  const [tenantRoom, setTenantRoom] = useState(null);
  const [tenantForm, setTenantForm] = useState(emptyTenantForm);
  const [tenantPhoto, setTenantPhoto] = useState(null);

  /* -------- Tenant history modal -------- */
  const [historyModal, setHistoryModal] = useState(false);
  const [historyRoom, setHistoryRoom] = useState(null);
  const [historyTenants, setHistoryTenants] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPhotoFor, setHistoryPhotoFor] = useState(null);

  /* -------- Rent modal (multi-month) -------- */
  const [rentModal, setRentModal] = useState(false);
  const [rentForm, setRentForm] = useState({ roomId: '', months: [], rentAmount: '', dueDate: '', notes: '' });
  const [rentResults, setRentResults] = useState(null);
  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentCharge, setPaymentCharge] = useState(null);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);

  /* -------- Electricity modal (multi-month) -------- */
  const [readingModal, setReadingModal] = useState(false);
  const [readingForm, setReadingForm] = useState({
    roomId: '', months: [], previousReading: '', currentReading: '', ratePerUnit: '', extraCharge: '0', notes: '',
  });
  const [readingResults, setReadingResults] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const [propertyData, roomsData, tenantsData, rentData, electricityData, expenseData] = await Promise.all([
        getProperties(),
        getRooms(propertyId),
        getTenants({ propertyId }),
        getRent({ propertyId }),
        getElectricity({ propertyId }),
        getExpenses({ propertyId }),
      ]);
      setProperty(propertyData.find((p) => p.id === propertyId) || null);
      setRooms(roomsData);
      setTenants(tenantsData);
      setRentRecords(rentData);
      setReadings(electricityData);
      setExpenses(expenseData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    if (propertyId) fetchData();
  }, [propertyId, router, fetchData]);

  /* ---------------- Property actions ---------------- */

  const openPropertyModal = () => {
    setPropertyForm({
      name: property?.name || '',
      address: property?.address || '',
      city: '',
      description: property?.description || '',
    });
    setPropertyModal(true);
  };

  const handlePropertySubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProperty(propertyId, {
        name: propertyForm.name,
        description: propertyForm.description || undefined,
      });
      setPropertyModal(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteProperty = async () => {
    if (!confirm(`Delete "${property?.name}" and all its data? This cannot be undone.`)) return;
    try {
      await deleteProperty(propertyId);
      router.push('/properties');
    } catch (err) {
      alert(err.message);
    }
  };

  /* ---------------- Room actions ---------------- */

  const openRoomModal = (room = null) => {
    setEditingRoom(room);
    setRoomForm(
      room
        ? {
            roomNumber: room.roomNumber,
            floor: room.floor || '',
            monthlyRent: room.monthlyRent || '',
            securityDeposit: room.securityDeposit || '',
            notes: room.notes || '',
          }
        : emptyRoomForm
    );
    setRoomModal(true);
  };

  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        roomNumber: roomForm.roomNumber,
        floor: roomForm.floor || undefined,
        monthlyRent: Number(roomForm.monthlyRent) || 0,
        securityDeposit: Number(roomForm.securityDeposit) || 0,
        notes: roomForm.notes || undefined,
      };
      if (editingRoom) {
        await updateRoom(editingRoom.id, payload);
      } else {
        await createRoom(propertyId, payload);
      }
      setRoomModal(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteRoom = async (room) => {
    if (!confirm(`Delete room ${room.roomNumber}? This cannot be undone.`)) return;
    try {
      await deleteRoom(room.id);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  /* ---------------- Tenant actions ---------------- */

  const openTenantModal = (room) => {
    setTenantRoom(room);
    setTenantForm({ ...emptyTenantForm, joiningDate: new Date().toISOString().slice(0, 10) });
    setTenantPhoto(null);
    setTenantModal(true);
  };

  const handleTenantSubmit = async (e) => {
    e.preventDefault();
    try {
      await createTenant(
        { room: tenantRoom.id, ...tenantForm },
        tenantPhoto || undefined
      );
      setTenantModal(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleMoveOut = async (tenantId, roomNumber) => {
    if (!confirm(`Move out the tenant of room ${roomNumber}?`)) return;
    try {
      await moveOutTenant(tenantId);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  /* ---------------- Tenant history (per room) ---------------- */

  const openHistoryModal = async (room) => {
    setHistoryRoom(room);
    setHistoryTenants([]);
    setHistoryPhotoFor(null);
    setHistoryModal(true);
    setHistoryLoading(true);
    try {
      const all = await getTenants({ propertyId });
      const roomTenants = all.filter((t) => {
        const key = typeof t.room === 'object' ? t.room?._id : t.room;
        return String(key) === String(room.id);
      });
      setHistoryTenants(roomTenants);
    } catch (err) {
      alert(err.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  /* ---------------- Rent (multi-month) ---------------- */

  const openRentModal = () => {
    const occupied = rooms.filter((r) => r.occupied);
    setRentForm({
      roomId: occupied[0]?.id || '',
      months: [currentMonth()],
      rentAmount: occupied[0] ? String(occupied[0].monthlyRent) : '',
      dueDate: new Date().toISOString().slice(0, 10),
      notes: '',
    });
    setRentResults(null);
    setRentModal(true);
  };

  const toggleRentMonth = (m) => {
    setRentForm((f) => ({
      ...f,
      months: f.months.includes(m) ? f.months.filter((x) => x !== m) : [...f.months, m].sort(),
    }));
  };

  const handleRentSubmit = async (e) => {
    e.preventDefault();
    if (!rentForm.months.length) return alert('Select at least one month');
    const results = { created: 0, skipped: [] };
    for (const month of rentForm.months) {
      try {
        await createRent({
          roomId: rentForm.roomId,
          month,
          rentAmount: Number(rentForm.rentAmount),
          dueDate: rentForm.dueDate || undefined,
          notes: rentForm.notes || undefined,
        });
        results.created += 1;
      } catch (err) {
        results.skipped.push(`${monthLabel(month)}: ${err.message}`);
      }
    }
    setRentResults(results);
    fetchData();
    if (results.created > 0 && results.skipped.length === 0) {
      setRentModal(false);
    }
  };

  const openPaymentModal = (record) => {
    setPaymentCharge(record);
    setPaymentForm({
      amount: String(record.remaining || ''),
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod: 'CASH',
      referenceNumber: '',
      notes: '',
    });
    setPaymentModal(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      await addRentPayment(paymentCharge.id, {
        amount: Number(paymentForm.amount),
        paymentDate: paymentForm.paymentDate,
        paymentMethod: paymentForm.paymentMethod,
        referenceNumber: paymentForm.referenceNumber || undefined,
        notes: paymentForm.notes || undefined,
      });
      setPaymentModal(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  /* ---------------- Electricity (multi-month, previous reading) ---------------- */

  const openReadingModal = () => {
    const occupied = rooms.filter((r) => r.occupied);
    setReadingForm({
      roomId: occupied[0]?.id || '',
      months: [currentMonth()],
      previousReading: '',
      currentReading: '',
      ratePerUnit: '8',
      extraCharge: '0',
      notes: '',
    });
    setReadingResults(null);
    setReadingModal(true);
  };

  // Prefill previous reading from the last recorded reading for the room
  const prefillPreviousReading = async (roomId) => {
    const roomReadings = readings
      .filter((r) => String(r.roomId) === String(roomId))
      .sort((a, b) => (a.month < b.month ? 1 : -1));
    if (roomReadings.length > 0) {
      setReadingForm((f) => ({ ...f, previousReading: String(roomReadings[0].currentReading) }));
      return;
    }
    try {
      const data = await getPreviousReading(roomId, currentMonth());
      if (data?.previousReading != null) {
        setReadingForm((f) => ({ ...f, previousReading: String(data.previousReading) }));
      }
    } catch {
      // no previous reading — leave empty
    }
  };

  const handleReadingRoomChange = (roomId) => {
    setReadingForm((f) => ({ ...f, roomId, previousReading: '' }));
    if (roomId) prefillPreviousReading(roomId);
  };

  const toggleReadingMonth = (m) => {
    setReadingForm((f) => ({
      ...f,
      months: f.months.includes(m) ? f.months.filter((x) => x !== m) : [...f.months, m].sort(),
    }));
  };

  const consumption = useMemo(() => {
    const prev = Number(readingForm.previousReading);
    const curr = Number(readingForm.currentReading);
    if (isNaN(prev) || isNaN(curr) || readingForm.currentReading === '') return null;
    return curr - prev;
  }, [readingForm.previousReading, readingForm.currentReading]);

  const estimatedAmount = useMemo(() => {
    if (consumption === null || consumption < 0) return null;
    const rate = Number(readingForm.ratePerUnit) || 0;
    const extra = Number(readingForm.extraCharge) || 0;
    return consumption * rate + extra;
  }, [consumption, readingForm.ratePerUnit, readingForm.extraCharge]);

  const handleReadingSubmit = async (e) => {
    e.preventDefault();
    if (!readingForm.months.length) return alert('Select at least one month');
    if (consumption === null || consumption < 0) return alert('Current reading must be greater than or equal to previous reading');
    const results = { created: 0, skipped: [] };
    for (const month of readingForm.months) {
      try {
        await createElectricity({
          roomId: readingForm.roomId,
          month,
          previousReading: Number(readingForm.previousReading),
          currentReading: Number(readingForm.currentReading),
          ratePerUnit: Number(readingForm.ratePerUnit),
          readingDate: new Date().toISOString().slice(0, 10),
          fixedCharge: 0,
          otherCharges: Number(readingForm.extraCharge) || 0,
          notes: readingForm.notes || undefined,
        });
        results.created += 1;
      } catch (err) {
        results.skipped.push(`${monthLabel(month)}: ${err.message}`);
      }
    }
    setReadingResults(results);
    fetchData();
    if (results.created > 0 && results.skipped.length === 0) {
      setReadingModal(false);
    }
  };

  /* ---------------- Derived ---------------- */

  const occupiedRooms = rooms.filter((r) => r.occupied).length;
  const activeTenants = tenants.filter((t) => t.status === 'ACTIVE');
  const pendingRent = rentRecords.filter((r) => r.status !== 'Paid').reduce((s, r) => s + r.remaining, 0);
  const monthStr = currentMonth();
  const monthElectricity = readings.filter((r) => r.month === monthStr);

  const tenantByRoom = {};
  activeTenants.forEach((t) => {
    const key = typeof t.room === 'object' ? t.room?._id : t.room;
    if (key) tenantByRoom[key] = t;
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-5 py-4 text-sm font-medium text-slate-500 shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-400">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          Loading property…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="pb-24 md:ml-64 md:pb-10">
        <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <header className="space-y-4">
            <button
              onClick={() => router.push('/properties')}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-emerald-600 dark:text-slate-400"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to properties
            </button>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25">
                  <Building2 className="h-5 w-5" />
                </span>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {property?.name || 'Property'}
                  </h1>
                  <p className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                    <MapPin className="h-3.5 w-3.5" />
                    {property?.address || '—'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" className="px-3 py-2 text-xs" onClick={openPropertyModal}>
                  <Edit2 className="h-4 w-4" />
                  Edit
                </Button>
                <Button variant="danger" className="px-3 py-2 text-xs" onClick={handleDeleteProperty}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </header>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Summary */}
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: 'Rooms', value: `${occupiedRooms}/${rooms.length}`, icon: DoorOpen, tone: 'from-sky-500 to-cyan-500 shadow-sky-500/25' },
              { label: 'Active Tenants', value: activeTenants.length, icon: Users, tone: 'from-violet-500 to-purple-500 shadow-violet-500/25' },
              { label: 'Pending Rent', value: inr(pendingRent), icon: Wallet, tone: 'from-rose-500 to-orange-500 shadow-rose-500/25' },
              { label: 'Electricity (month)', value: inr(monthElectricity.reduce((s, r) => s + r.total, 0)), icon: Zap, tone: 'from-amber-400 to-yellow-500 shadow-amber-500/25' },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="flex items-center gap-3">
                  <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg', stat.tone)}>
                    <stat.icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-bold text-slate-900 dark:text-white">{stat.value}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>

          {/* Rooms */}
          <Card>
            <CardHeader>
              <CardTitle>Rooms</CardTitle>
              <Button onClick={() => openRoomModal()} className="px-3 py-2 text-xs">
                <Plus className="h-4 w-4" />
                Add Room
              </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {rooms.length === 0 && (
                <p className="py-6 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">No rooms yet. Add your first room.</p>
              )}
              {rooms.map((room) => {
                const tenant = tenantByRoom[room.id];
                return (
                  <div
                    key={room.id}
                    className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">Room {room.roomNumber}</p>
                        {room.floor && <p className="text-xs text-slate-500 dark:text-slate-400">Floor {room.floor}</p>}
                      </div>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ring-1 ring-inset',
                          room.occupied
                            ? 'bg-emerald-100 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-white/10 dark:text-slate-300'
                        )}
                      >
                        {room.occupied ? 'Occupied' : room.status === 'MAINTENANCE' ? 'Maintenance' : 'Vacant'}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1 text-sm">
                      <p className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span>Rent</span>
                        <span className="font-semibold">{inr(room.monthlyRent)}/mo</span>
                      </p>
                      <p className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span>Deposit</span>
                        <span>{inr(room.securityDeposit)}</span>
                      </p>
                      {tenant && (
                        <p className="flex items-center justify-between gap-2 text-slate-600 dark:text-slate-300">
                          <span>Tenant</span>
                          <span className="truncate text-right font-medium">{tenant.fullName}</span>
                        </p>
                      )}
                    </div>

                    {/* Tenant + history buttons */}
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {tenant ? (
                        <>
                          <Button variant="outline" className="px-2 py-1.5 text-xs" onClick={() => handleMoveOut(tenant._id || tenant.id, room.roomNumber)}>
                            Move out
                          </Button>
                          <Button variant="secondary" className="px-2 py-1.5 text-xs" onClick={() => openHistoryModal(room)}>
                            <History className="h-3.5 w-3.5" />
                            History
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="outline" className="px-2 py-1.5 text-xs" onClick={() => openTenantModal(room)}>
                            <UserPlus className="h-3.5 w-3.5" />
                            Add Tenant
                          </Button>
                          <Button variant="secondary" className="px-2 py-1.5 text-xs" onClick={() => openHistoryModal(room)}>
                            <History className="h-3.5 w-3.5" />
                            Tenant History
                          </Button>
                        </>
                      )}
                    </div>

                    <div className="mt-2 flex gap-2 border-t border-slate-100 pt-3 dark:border-white/5">
                      <Button variant="secondary" className="flex-1 px-2 py-1.5 text-xs" onClick={() => openRoomModal(room)}>
                        <Edit2 className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button variant="danger" className="px-2 py-1.5 text-xs" onClick={() => handleDeleteRoom(room)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25">
                    <Wallet className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Add Rent</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Single or multiple months</p>
                  </div>
                </div>
                <Button onClick={openRentModal} className="px-3 py-2 text-xs" disabled={occupiedRooms === 0}>
                  <Plus className="h-4 w-4" />
                  New
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-lg shadow-amber-500/25">
                    <Zap className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Electricity Bill</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Units, rate & extra charges</p>
                  </div>
                </div>
                <Button onClick={openReadingModal} className="px-3 py-2 text-xs" disabled={occupiedRooms === 0}>
                  <Plus className="h-4 w-4" />
                  New
                </Button>
              </CardContent>
            </Card>
          </section>

          {/* Tabs: Rent / Electricity / Expenses */}
          <Card className="overflow-hidden">
            <div className="flex gap-1 overflow-x-auto border-b border-slate-200/80 bg-slate-50/60 px-2 pt-2 dark:border-white/10 dark:bg-white/5">
              {TABS.map((tab, i) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(i)}
                  className={cn(
                    'whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm font-medium transition',
                    activeTab === i
                      ? 'border-b-2 border-emerald-500 bg-white text-emerald-600 dark:bg-slate-900 dark:text-emerald-400'
                      : 'border-b-2 border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 0 && (
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[44rem]">
                    <thead className="bg-slate-50/80 dark:bg-white/5">
                      <tr>
                        {['Room', 'Tenant', 'Month', 'Rent', 'Paid', 'Remaining', 'Status', ''].map((h) => (
                          <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rentRecords.map((r) => (
                        <tr key={r.id} className="border-t border-slate-100 dark:border-white/5">
                          <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{r.roomNumber}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{r.tenantName || 'Vacant'}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{r.monthLabel}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm">{inr(r.rentAmount)}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-emerald-600">{inr(r.paidAmount)}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-rose-600">{inr(r.remaining)}</td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <span className={cn('inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ring-1 ring-inset', statusStyles(r.status))}>
                              {r.status}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right">
                            {r.remaining > 0 && (
                              <Button variant="outline" className="px-2 py-1 text-xs" onClick={() => openPaymentModal(r)}>
                                <IndianRupee className="h-3.5 w-3.5" />
                                Pay
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {rentRecords.length === 0 && (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-sm text-slate-500">No rent records yet</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            )}

            {activeTab === 1 && (
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[48rem]">
                    <thead className="bg-slate-50/80 dark:bg-white/5">
                      <tr>
                        {['Room', 'Month', 'Prev', 'Curr', 'Units', 'Rate', 'Extra', 'Total'].map((h) => (
                          <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {readings.map((r) => (
                        <tr key={r.id} className="border-t border-slate-100 dark:border-white/5">
                          <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{r.roomNumber}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{r.monthLabel}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">{r.previousReading}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">{r.currentReading}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-amber-600">{r.units}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">₹{r.ratePerUnit}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">{inr(r.otherCharges)}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm font-bold text-slate-900 dark:text-white">{inr(r.total)}</td>
                        </tr>
                      ))}
                      {readings.length === 0 && (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-sm text-slate-500">No electricity bills yet</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            )}

            {activeTab === 2 && (
              <CardContent className="space-y-2">
                {expenses.map((e) => (
                  <div key={e.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50/70 p-3 dark:bg-white/5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{e.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {e.date} · {e.category}{e.roomNumber ? ` · Room ${e.roomNumber}` : ''}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-slate-900 dark:text-white">{inr(e.amount)}</p>
                  </div>
                ))}
                {expenses.length === 0 && <p className="py-6 text-center text-sm text-slate-500">No expenses yet</p>}
              </CardContent>
            )}
          </Card>
        </div>
      </main>

      {/* Property edit modal */}
      <Modal open={propertyModal} onClose={() => setPropertyModal(false)} title="Edit Property">
        <form onSubmit={handlePropertySubmit} className="space-y-4">
          <div>
            <Label htmlFor="prop-name">Name</Label>
            <Input id="prop-name" value={propertyForm.name} onChange={(e) => setPropertyForm({ ...propertyForm, name: e.target.value })} required />
          </div>
          <div>
            <Label htmlFor="prop-addr">Address</Label>
            <Textarea id="prop-addr" rows={2} value={propertyForm.address} onChange={(e) => setPropertyForm({ ...propertyForm, address: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setPropertyModal(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">Update</Button>
          </div>
        </form>
      </Modal>

      {/* Room modal */}
      <Modal open={roomModal} onClose={() => setRoomModal(false)} title={editingRoom ? 'Edit Room' : 'Add Room'}>
        <form onSubmit={handleRoomSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="room-number">Room Number</Label>
              <Input id="room-number" value={roomForm.roomNumber} onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })} placeholder="101" required />
            </div>
            <div>
              <Label htmlFor="room-floor">Floor</Label>
              <Input id="room-floor" value={roomForm.floor} onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })} placeholder="1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="room-rent">Monthly Rent</Label>
              <Input id="room-rent" type="number" min="0" value={roomForm.monthlyRent} onChange={(e) => setRoomForm({ ...roomForm, monthlyRent: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="room-deposit">Security Deposit</Label>
              <Input id="room-deposit" type="number" min="0" value={roomForm.securityDeposit} onChange={(e) => setRoomForm({ ...roomForm, securityDeposit: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setRoomModal(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">{editingRoom ? 'Update' : 'Add'}</Button>
          </div>
        </form>
      </Modal>

      {/* Tenant modal (with photo upload) */}
      <Modal open={tenantModal} onClose={() => setTenantModal(false)} title="Add Tenant" subtitle={tenantRoom ? `Room ${tenantRoom.roomNumber}` : ''}>
        <form onSubmit={handleTenantSubmit} className="space-y-4">
          <div>
            <Label htmlFor="tenant-name">Full Name</Label>
            <Input id="tenant-name" value={tenantForm.fullName} onChange={(e) => setTenantForm({ ...tenantForm, fullName: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="tenant-mobile">Mobile</Label>
              <Input id="tenant-mobile" value={tenantForm.mobile} onChange={(e) => setTenantForm({ ...tenantForm, mobile: e.target.value })} placeholder="10-digit mobile" />
            </div>
            <div>
              <Label htmlFor="tenant-occupation">Occupation</Label>
              <Input id="tenant-occupation" value={tenantForm.occupation} onChange={(e) => setTenantForm({ ...tenantForm, occupation: e.target.value })} />
            </div>
          </div>
          <div>
            <Label htmlFor="tenant-address">Permanent Address</Label>
            <Textarea id="tenant-address" rows={2} value={tenantForm.permanentAddress} onChange={(e) => setTenantForm({ ...tenantForm, permanentAddress: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="tenant-joining">Joining Date</Label>
            <Input id="tenant-joining" type="date" value={tenantForm.joiningDate} onChange={(e) => setTenantForm({ ...tenantForm, joiningDate: e.target.value })} required />
          </div>
          <div>
            <Label htmlFor="tenant-photo">Photo / Document (optional)</Label>
            <label
              htmlFor="tenant-photo"
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500 transition hover:border-emerald-400 hover:text-emerald-600 dark:border-white/15 dark:text-slate-400"
            >
              <ImageIcon className="h-4 w-4" />
              {tenantPhoto ? tenantPhoto.name : 'Choose an image (JPG/PNG, max 5MB)'}
            </label>
            <input
              id="tenant-photo"
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              className="hidden"
              onChange={(e) => setTenantPhoto(e.target.files?.[0] || null)}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setTenantModal(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">Add Tenant</Button>
          </div>
        </form>
      </Modal>

      {/* Tenant history modal */}
      <Modal open={historyModal} onClose={() => setHistoryModal(false)} title="Tenant History" subtitle={historyRoom ? `Room ${historyRoom.roomNumber}` : ''}>
        {historyLoading ? (
          <p className="py-6 text-center text-sm text-slate-500">Loading…</p>
        ) : historyTenants.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">No tenant history for this room yet.</p>
        ) : (
          <div className="space-y-2">
            {historyTenants.map((t) => (
              <div key={t._id || t.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50/70 p-3 dark:bg-white/5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{t.fullName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t.mobile || 'No mobile'} · {t.status === 'ACTIVE' ? 'Active' : 'Moved out'}
                  </p>
                </div>
                {t.hasPhoto ? (
                  <Button
                    variant="outline"
                    className="px-2 py-1 text-xs"
                    onClick={() => {
                      setHistoryPhotoFor(t);
                      setHistoryModal(false);
                      router.push(`/properties/${propertyId}/tenants/${t._id || t.id}/documents`);
                    }}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Show Doc
                  </Button>
                ) : (
                  <span className="text-xs text-slate-400">No document</span>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Rent charge modal (multi-month) */}
      <Modal open={rentModal} onClose={() => setRentModal(false)} title="New Rent Charge">
        <form onSubmit={handleRentSubmit} className="space-y-4">
          <div>
            <Label htmlFor="rent-room">Room</Label>
            <Select id="rent-room" value={rentForm.roomId} onChange={(e) => {
              const room = rooms.find((r) => r.id === e.target.value);
              setRentForm({ ...rentForm, roomId: e.target.value, rentAmount: room ? String(room.monthlyRent) : rentForm.rentAmount });
            }} required>
              <option value="">Select room…</option>
              {rooms.filter((r) => r.occupied).map((r) => (
                <option key={r.id} value={r.id}>Room {r.roomNumber} — {r.tenantName || 'Occupied'}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                Months (click to toggle — select one or many)
              </span>
            </Label>
            <div className="grid max-h-44 grid-cols-3 gap-1.5 overflow-y-auto rounded-xl border border-slate-200/80 p-2 dark:border-white/10">
              {monthsBetween('2024-01', `${new Date().getFullYear() + 1}-12`).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleRentMonth(m)}
                  className={cn(
                    'rounded-lg px-2 py-1.5 text-xs font-medium transition',
                    rentForm.months.includes(m)
                      ? 'bg-emerald-500 text-white shadow'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/20'
                  )}
                >
                  {monthLabel(m)}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Selected: {rentForm.months.length ? rentForm.months.map(monthLabel).join(', ') : 'none'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="rent-amount">Rent Amount</Label>
              <Input id="rent-amount" type="number" min="0" value={rentForm.rentAmount} onChange={(e) => setRentForm({ ...rentForm, rentAmount: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="rent-due">Due Date</Label>
              <Input id="rent-due" type="date" value={rentForm.dueDate} onChange={(e) => setRentForm({ ...rentForm, dueDate: e.target.value })} />
            </div>
          </div>
          {rentResults && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-white/10 dark:bg-white/5">
              <p className="font-semibold text-emerald-600">Created: {rentResults.created}</p>
              {rentResults.skipped.length > 0 && (
                <ul className="mt-1 list-inside list-disc text-rose-500">
                  {rentResults.skipped.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              )}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setRentModal(false)}>Close</Button>
            <Button type="submit" className="flex-1">Create ({rentForm.months.length})</Button>
          </div>
        </form>
      </Modal>

      {/* Payment modal */}
      <Modal open={paymentModal} onClose={() => setPaymentModal(false)} title="Record Payment" subtitle={paymentCharge ? `Room ${paymentCharge.roomNumber} · ${paymentCharge.monthLabel}` : ''}>
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="pay-amount">Amount</Label>
              <Input id="pay-amount" type="number" min="1" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="pay-date">Payment Date</Label>
              <Input id="pay-date" type="date" value={paymentForm.paymentDate} onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })} required />
            </div>
          </div>
          <div>
            <Label htmlFor="pay-method">Method</Label>
            <Select id="pay-method" value={paymentForm.paymentMethod} onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}>
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CHEQUE">Cheque</option>
              <option value="OTHER">Other</option>
            </Select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setPaymentModal(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">Save Payment</Button>
          </div>
        </form>
      </Modal>

      {/* Electricity modal (multi-month with previous/current readings) */}
      <Modal open={readingModal} onClose={() => setReadingModal(false)} title="Add Electricity Bill">
        <form onSubmit={handleReadingSubmit} className="space-y-4">
          <div>
            <Label htmlFor="elec-room">Room</Label>
            <Select id="elec-room" value={readingForm.roomId} onChange={(e) => handleReadingRoomChange(e.target.value)} required>
              <option value="">Select room…</option>
              {rooms.filter((r) => r.occupied).map((r) => (
                <option key={r.id} value={r.id}>Room {r.roomNumber}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                Months (click to toggle — select one or many)
              </span>
            </Label>
            <div className="grid max-h-44 grid-cols-3 gap-1.5 overflow-y-auto rounded-xl border border-slate-200/80 p-2 dark:border-white/10">
              {monthsBetween('2024-01', `${new Date().getFullYear() + 1}-12`).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleReadingMonth(m)}
                  className={cn(
                    'rounded-lg px-2 py-1.5 text-xs font-medium transition',
                    readingForm.months.includes(m)
                      ? 'bg-amber-500 text-white shadow'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/20'
                  )}
                >
                  {monthLabel(m)}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Selected: {readingForm.months.length ? readingForm.months.map(monthLabel).join(', ') : 'none'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="elec-prev">Previous Reading (units)</Label>
              <Input id="elec-prev" type="number" min="0" value={readingForm.previousReading} onChange={(e) => setReadingForm({ ...readingForm, previousReading: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="elec-curr">Current Reading (units)</Label>
              <Input id="elec-curr" type="number" min="0" value={readingForm.currentReading} onChange={(e) => setReadingForm({ ...readingForm, currentReading: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="elec-rate">Cost per Unit (₹)</Label>
              <Input id="elec-rate" type="number" min="0" step="0.01" value={readingForm.ratePerUnit} onChange={(e) => setReadingForm({ ...readingForm, ratePerUnit: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="elec-extra">Extra Charge (₹)</Label>
              <Input id="elec-extra" type="number" min="0" value={readingForm.extraCharge} onChange={(e) => setReadingForm({ ...readingForm, extraCharge: e.target.value })} />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3 text-sm dark:bg-amber-500/10">
            <span className="text-slate-600 dark:text-slate-300">
              Consumption: <strong>{consumption === null ? '—' : consumption < 0 ? 'invalid' : `${consumption} units`}</strong>
            </span>
            <span className="font-bold text-slate-900 dark:text-white">
              Total: {estimatedAmount === null ? '—' : inr(estimatedAmount)}
            </span>
          </div>
          {readingResults && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-white/10 dark:bg-white/5">
              <p className="font-semibold text-emerald-600">Created: {readingResults.created}</p>
              {readingResults.skipped.length > 0 && (
                <ul className="mt-1 list-inside list-disc text-rose-500">
                  {readingResults.skipped.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              )}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setReadingModal(false)}>Close</Button>
            <Button type="submit" className="flex-1">Save ({readingForm.months.length})</Button>
          </div>
        </form>
      </Modal>

      <MobileNav />
    </div>
  );
}
