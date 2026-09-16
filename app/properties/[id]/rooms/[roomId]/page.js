'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '../../../../../components/Sidebar';
import MobileNav from '../../../../../components/MobileNav';
import Card, { CardContent, CardHeader, CardTitle } from '../../../../../components/Card';
import Button from '../../../../../components/Button';
import Input, { Label, Textarea } from '../../../../../components/Input';
import Select from '../../../../../components/Select';
import Modal from '../../../../../components/Modal';
import { getProperties, getRooms, getRent, createRent, addRentPayment, getElectricity, createElectricity } from '../../../../../lib/api';
import { cn, statusStyles, currentMonth, monthOptions } from '../../../../../lib/utils';
import {
  Home,
  User,
  Phone,
  Wallet,
  Zap,
  Plus,
  ArrowLeft,
  CalendarDays,
  Receipt,
  ShieldCheck,
} from 'lucide-react';

const emptyRentForm = {
  month: '',
  rentAmount: '',
  notes: ''
};

const emptyElectricityForm = {
  month: '',
  billDate: '',
  previousReading: '',
  currentReading: '',
  ratePerUnit: '',
  fixedCharge: '0',
  otherCharges: '0'
};

function Value({ label, value, tone = 'text-slate-900 dark:text-white' }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className={cn('mt-0.5 text-sm font-semibold', tone)}>{value}</p>
    </div>
  );
}

export default function RoomDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id;
  const roomId = params.roomId;

  const [property, setProperty] = useState(null);
  const [room, setRoom] = useState(null);
  const [rentRecords, setRentRecords] = useState([]);
  const [electricityRecords, setElectricityRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showRentModal, setShowRentModal] = useState(false);
  const [showElectricityModal, setShowElectricityModal] = useState(false);

  const [rentFormData, setRentFormData] = useState(emptyRentForm);
  const [electricityFormData, setElectricityFormData] = useState(emptyElectricityForm);
  const [monthOpts] = useState(() => monthOptions());

  const openRentModal = () => {
    setRentFormData({
      month: currentMonth(),
      rentAmount: room ? String(room.monthlyRent) : '',
      notes: '',
    });
    setShowRentModal(true);
  };

  const openElectricityModal = () => {
    setElectricityFormData({
      month: currentMonth(),
      billDate: new Date().toISOString().slice(0, 10),
      previousReading: '',
      currentReading: '',
      ratePerUnit: '8',
      fixedCharge: '0',
      otherCharges: '0',
    });
    setShowElectricityModal(true);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [propertyId, roomId, router]);

  const fetchData = async () => {
    try {
      const [propertiesData, roomsData, rentData, electricityData] = await Promise.all([
        getProperties(),
        getRooms(),
        getRent(),
        getElectricity()
      ]);

      const propertyData = propertiesData.find(p => p.id === propertyId);
      const roomData = roomsData.find(r => r.id === roomId);
      const roomRentData = rentData.filter(r => r.roomId === roomId);
      const roomElectricityData = electricityData.filter(e => e.roomId === roomId);

      setProperty(propertyData);
      setRoom(roomData);
      setRentRecords(roomRentData);
      setElectricityRecords(roomElectricityData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRentSubmit = async (e) => {
    e.preventDefault();
    try {
      await createRent({
        roomId,
        month: rentFormData.month,
        rentAmount: parseFloat(rentFormData.rentAmount),
        notes: rentFormData.notes || undefined
      });
      setShowRentModal(false);
      setRentFormData(emptyRentForm);
      fetchData();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleElectricitySubmit = async (e) => {
    e.preventDefault();
    try {
      await createElectricity({
        roomId,
        month: electricityFormData.month,
        billDate: electricityFormData.billDate,
        previousReading: parseFloat(electricityFormData.previousReading),
        currentReading: parseFloat(electricityFormData.currentReading),
        ratePerUnit: parseFloat(electricityFormData.ratePerUnit),
        fixedCharge: parseFloat(electricityFormData.fixedCharge) || 0,
        otherCharges: parseFloat(electricityFormData.otherCharges) || 0
      });
      setShowElectricityModal(false);
      setElectricityFormData(emptyElectricityForm);
      fetchData();
    } catch (error) {
      alert(error.message);
    }
  };

  const getPreviousReading = () => {
    const sortedRecords = [...electricityRecords].sort((a, b) => new Date(b.billDate) - new Date(a.billDate));
    return sortedRecords.length > 0 ? sortedRecords[0].currentReading : 0;
  };

  const sortByRecency = (records) =>
    [...records].sort((a, b) => (b.month || '').localeCompare(a.month || ''));

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-5 py-4 text-sm font-medium text-slate-500 shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-400">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          Loading room…
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="font-semibold text-slate-800 dark:text-slate-100">Room not found</p>
            <Button className="mt-4" variant="secondary" onClick={() => router.push(`/properties/${propertyId}`)}>
              Back to Property
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalPaid = rentRecords.reduce((sum, record) => sum + (record.paidAmount || 0), 0);
  const totalPending = rentRecords.reduce((sum, record) => sum + (record.remaining || 0), 0);
  const totalElectricity = electricityRecords.reduce((sum, record) => sum + (record.total || 0), 0);

  const summary = [
    { label: 'Rent collected', value: `₹${totalPaid.toLocaleString()}`, icon: Wallet, tone: 'from-emerald-500 to-teal-500 shadow-emerald-500/25' },
    { label: 'Rent pending', value: `₹${totalPending.toLocaleString()}`, icon: Receipt, tone: 'from-rose-500 to-orange-500 shadow-rose-500/25' },
    { label: 'Electricity billed', value: `₹${totalElectricity.toLocaleString()}`, icon: Zap, tone: 'from-amber-400 to-yellow-500 shadow-amber-500/25' },
  ];

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="pb-24 md:ml-64 md:pb-10">
        <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <Button variant="ghost" className="-ml-2 px-2" onClick={() => router.push(`/properties/${propertyId}`)}>
            <ArrowLeft className="h-4 w-4" />
            Back to Property
          </Button>

          {/* Room banner */}
          <section
            className={cn(
              'relative animate-fade-up overflow-hidden rounded-3xl p-6 text-white shadow-xl sm:p-8',
              room.occupied
                ? 'bg-gradient-to-br from-emerald-500 via-teal-500 to-teal-600 shadow-emerald-900/20'
                : 'bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700 shadow-slate-900/20'
            )}
          >
            <div aria-hidden="true" className="absolute -right-16 -top-24 h-56 w-56 rounded-full bg-white/15 blur-2xl" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ring-1 ring-inset ring-white/25">
                  <Home className="h-3.5 w-3.5" />
                  Room {room.roomNumber}
                </span>
                <h1 className="mt-3 truncate text-2xl font-bold tracking-tight sm:text-3xl">
                  {property?.name || 'Property'}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/85">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 ring-1 ring-inset ring-white/20">
                    <span className={cn('h-1.5 w-1.5 rounded-full', room.occupied ? 'bg-emerald-200' : 'bg-slate-300')} />
                    {room.occupied ? 'Occupied' : 'Vacant'}
                  </span>
                  {room.occupied && room.tenantName && (
                    <span className="inline-flex items-center gap-1.5">
                      <User className="h-4 w-4" />
                      {room.tenantName}
                    </span>
                  )}
                  {room.occupied && room.tenantPhone && (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="h-4 w-4" />
                      {room.tenantPhone}
                    </span>
                  )}
                </div>
                {room.notes && <p className="mt-3 max-w-xl text-sm text-white/75">{room.notes}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:max-w-xs">
                <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-inset ring-white/20">
                  <p className="flex items-center gap-1.5 text-xs text-white/80">
                    <Wallet className="h-3.5 w-3.5" />
                    Monthly rent
                  </p>
                  <p className="mt-1 text-xl font-bold">₹{room.monthlyRent?.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-inset ring-white/20">
                  <p className="flex items-center gap-1.5 text-xs text-white/80">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Deposit
                  </p>
                  <p className="mt-1 text-xl font-bold">₹{room.securityDeposit?.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Totals */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {summary.map((item) => (
              <Card
                key={item.label}
                className="hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-900/5"
              >
                <CardContent className="flex items-center gap-4">
                  <span
                    className={cn(
                      'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg',
                      item.tone
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                      {item.value}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{item.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Rent Records</CardTitle>
                <Button onClick={openRentModal}>
                  <Plus className="h-4 w-4" />
                  Add Rent
                </Button>
              </CardHeader>
              <CardContent>
                {rentRecords.length === 0 ? (
                  <div className="py-10 text-center">
                    <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500">
                      <Receipt className="h-6 w-6" />
                    </span>
                    <p className="text-sm text-slate-500 dark:text-slate-400">No rent records found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sortByRecency(rentRecords).map((record) => (
                      <div
                        key={record.id}
                        className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-white/5 dark:bg-white/5"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                            <CalendarDays className="h-4 w-4 text-slate-400" />
                            {record.monthLabel || record.month}
                          </span>
                          <span
                            className={cn(
                              'rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset',
                              statusStyles(record.status)
                            )}
                          >
                            {record.status}
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <Value label="Rent" value={`₹${record.rentAmount?.toLocaleString()}`} />
                          <Value
                            label="Paid"
                            value={`₹${record.paidAmount?.toLocaleString()}`}
                            tone="text-emerald-600 dark:text-emerald-400"
                          />
                          <Value
                            label="Remaining"
                            value={`₹${record.remaining?.toLocaleString()}`}
                            tone="text-rose-600 dark:text-rose-400"
                          />
                          <Value label="Date" value={record.paymentDate || '—'} />
                        </div>
                        {record.remaining > 0 && (
                          <div className="mt-3 text-right">
                            <Button
                              variant="outline"
                              className="px-3 py-1.5 text-xs"
                              onClick={async () => {
                                const amount = prompt('Payment amount (₹):', String(record.remaining));
                                if (!amount) return;
                                try {
                                  await addRentPayment(record.id, {
                                    amount: parseFloat(amount),
                                    paymentDate: new Date().toISOString().slice(0, 10),
                                    paymentMethod: 'CASH',
                                  });
                                  fetchData();
                                } catch (err) {
                                  alert(err.message);
                                }
                              }}
                            >
                              Record Payment
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Electricity Records</CardTitle>
                <Button onClick={openElectricityModal}>
                  <Plus className="h-4 w-4" />
                  Add Bill
                </Button>
              </CardHeader>
              <CardContent>
                {electricityRecords.length === 0 ? (
                  <div className="py-10 text-center">
                    <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500">
                      <Zap className="h-6 w-6" />
                    </span>
                    <p className="text-sm text-slate-500 dark:text-slate-400">No electricity records found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sortByRecency(electricityRecords).map((record) => (
                      <div
                        key={record.id}
                        className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-white/5 dark:bg-white/5"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                            <CalendarDays className="h-4 w-4 text-slate-400" />
                            {record.month} {record.year}
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/25">
                            <Zap className="h-3.5 w-3.5" />
                            {record.units} units
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <Value label="Previous" value={record.previousReading} />
                          <Value label="Current" value={record.currentReading} />
                          <Value label="Units" value={record.units} />
                          <Value
                            label="Total"
                            value={`₹${record.total?.toLocaleString()}`}
                            tone="text-amber-600 dark:text-amber-400"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Modal
        open={showRentModal}
        onClose={() => setShowRentModal(false)}
        title="Add Rent"
        subtitle={`Room ${room.roomNumber} · ${property?.name || ''}`}
      >
        <form onSubmit={handleRentSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="rent-month">Billing Month</Label>
              <Input
                id="rent-month"
                type="month"
                value={rentFormData.month}
                onChange={(e) => setRentFormData({ ...rentFormData, month: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="rent-amount">Rent Amount (₹)</Label>
              <Input
                id="rent-amount"
                type="number"
                min="0"
                value={rentFormData.rentAmount}
                onChange={(e) => setRentFormData({ ...rentFormData, rentAmount: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="rent-notes">Notes</Label>
            <Textarea
              id="rent-notes"
              value={rentFormData.notes}
              onChange={(e) => setRentFormData({ ...rentFormData, notes: e.target.value })}
              placeholder="Optional"
              rows={2}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowRentModal(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">Add Rent</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={showElectricityModal}
        onClose={() => setShowElectricityModal(false)}
        title="Add Electricity Bill"
        subtitle={`Room ${room.roomNumber} · ${property?.name || ''}`}
      >
        <form onSubmit={handleElectricitySubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="elec-month">Billing Month</Label>
              <Input
                id="elec-month"
                type="month"
                value={electricityFormData.month}
                onChange={(e) => setElectricityFormData({ ...electricityFormData, month: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="elec-bill-date">Bill Date</Label>
              <Input
                id="elec-bill-date"
                type="date"
                value={electricityFormData.billDate}
                onChange={(e) => setElectricityFormData({ ...electricityFormData, billDate: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="elec-prev">Previous Reading</Label>
              <Input
                id="elec-prev"
                type="number"
                value={electricityFormData.previousReading}
                onChange={(e) => setElectricityFormData({ ...electricityFormData, previousReading: e.target.value })}
                placeholder={getPreviousReading() ? `Last: ${getPreviousReading()}` : 'Meter start'}
                required
              />
            </div>
            <div>
              <Label htmlFor="elec-curr">Current Reading</Label>
              <Input
                id="elec-curr"
                type="number"
                value={electricityFormData.currentReading}
                onChange={(e) => setElectricityFormData({ ...electricityFormData, currentReading: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="elec-rate">Rate Per Unit (₹)</Label>
              <Input
                id="elec-rate"
                type="number"
                value={electricityFormData.ratePerUnit}
                onChange={(e) => setElectricityFormData({ ...electricityFormData, ratePerUnit: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="elec-fixed">Fixed Charge (₹)</Label>
              <Input
                id="elec-fixed"
                type="number"
                min="0"
                value={electricityFormData.fixedCharge}
                onChange={(e) => setElectricityFormData({ ...electricityFormData, fixedCharge: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="elec-other">Other Charges (₹)</Label>
              <Input
                id="elec-other"
                type="number"
                min="0"
                value={electricityFormData.otherCharges}
                onChange={(e) => setElectricityFormData({ ...electricityFormData, otherCharges: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowElectricityModal(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">Add Bill</Button>
          </div>
        </form>
      </Modal>

      <MobileNav />
    </div>
  );
}
