'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import MobileNav from '../../components/MobileNav';
import Card, { CardContent } from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import { getElectricity, getProperties, getRooms } from '../../lib/api';
import { cn, monthOptions } from '../../lib/utils';
import { Download, Search, Zap, Gauge, Receipt, CircleDollarSign } from 'lucide-react';
import jsPDF from 'jspdf';

const thClass =
  'whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400';
const tdClass = 'whitespace-nowrap px-4 py-3.5 text-sm text-slate-700 dark:text-slate-200';

export default function ElectricityPage() {
  const router = useRouter();
  const [electricityRecords, setElectricityRecords] = useState([]);
  const [properties, setProperties] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    propertyId: '',
    roomId: '',
    month: '',
    year: '',
    search: ''
  });

  const monthOpts = monthOptions();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [router]);

  useEffect(() => {
    applyFilters();
  }, [electricityRecords, filters]);

  const fetchData = async () => {
    try {
      const [electricityData, propertiesData, roomsData] = await Promise.all([
        getElectricity(),
        getProperties(),
        getRooms()
      ]);

      setElectricityRecords(electricityData);
      setProperties(propertiesData);
      setRooms(roomsData);
    } catch (error) {
      console.error('Error fetching electricity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...electricityRecords];

    if (filters.propertyId) {
      filtered = filtered.filter(r => {
        const room = rooms.find(room => room.id === r.roomId);
        return room?.propertyId === parseInt(filters.propertyId);
      });
    }

    if (filters.roomId) {
      filtered = filtered.filter(r => r.roomId === parseInt(filters.roomId));
    }

    if (filters.month) {
      filtered = filtered.filter(r => r.month === filters.month);
    }

    if (filters.year) {
      filtered = filtered.filter(r => String(r.year) === String(filters.year));
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(r =>
        r.tenantName?.toLowerCase().includes(searchLower) ||
        r.propertyName?.toLowerCase().includes(searchLower) ||
        r.roomNumber?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredRecords(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const downloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Electricity Report', 14, 22);

    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

    if (filters.propertyId) {
      const prop = properties.find(p => p.id === parseInt(filters.propertyId));
      doc.text(`Property: ${prop?.name || 'All'}`, 14, 38);
    }
    if (filters.month) {
      const m = monthOpts.find(o => o.value === filters.month);
      doc.text(`Month: ${m?.label || filters.month}`, 14, 44);
    }
    if (filters.year) {
      doc.text(`Year: ${filters.year}`, 14, 50);
    }

    let y = 60;
    doc.setFontSize(8);
    doc.text('Property', 14, y);
    doc.text('Room', 40, y);
    doc.text('Tenant', 55, y);
    doc.text('Month', 85, y);
    doc.text('Bill Date', 105, y);
    doc.text('Prev', 125, y);
    doc.text('Curr', 140, y);
    doc.text('Units', 155, y);
    doc.text('Rate', 170, y);
    doc.text('Elec', 180, y);
    doc.text('Other', 190, y);
    doc.text('Total', 200, y);

    y += 8;
    doc.line(14, y - 2, 200, y - 2);

    filteredRecords.forEach(record => {
      y += 7;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(record.propertyName || '-', 14, y);
      doc.text(record.roomNumber || '-', 40, y);
      doc.text(record.tenantName || '-', 55, y);
      doc.text(record.monthLabel || `${record.month} ${record.year}`, 85, y);
      doc.text(record.billDate || '-', 105, y);
      doc.text(record.previousReading.toString(), 125, y);
      doc.text(record.currentReading.toString(), 140, y);
      doc.text(record.units.toString(), 155, y);
      doc.text(`₹${record.ratePerUnit}`, 170, y);
      doc.text(`₹${record.electricityAmount}`, 180, y);
      doc.text(`₹${record.otherCharges}`, 190, y);
      doc.text(`₹${record.total}`, 200, y);
    });

    y += 10;
    const totalUnits = filteredRecords.reduce((sum, r) => sum + r.units, 0);
    const totalElectricity = filteredRecords.reduce((sum, r) => sum + r.electricityAmount, 0);
    const totalOtherCharges = filteredRecords.reduce((sum, r) => sum + r.otherCharges, 0);
    const totalAmount = filteredRecords.reduce((sum, r) => sum + r.total, 0);

    doc.setFontSize(12);
    doc.text(`Total Units: ${totalUnits}`, 14, y);
    doc.text(`Total Electricity: ₹${totalElectricity.toLocaleString()}`, 14, y + 8);
    doc.text(`Total Other Charges: ₹${totalOtherCharges.toLocaleString()}`, 14, y + 16);
    doc.text(`Total Amount: ₹${totalAmount.toLocaleString()}`, 14, y + 24);

    doc.save('electricity-report.pdf');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-5 py-4 text-sm font-medium text-slate-500 shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-400">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          Loading electricity records…
        </div>
      </div>
    );
  }

  const totalUnits = filteredRecords.reduce((sum, r) => sum + r.units, 0);
  const totalElectricity = filteredRecords.reduce((sum, r) => sum + r.electricityAmount, 0);
  const totalOtherCharges = filteredRecords.reduce((sum, r) => sum + r.otherCharges, 0);
  const totalAmount = filteredRecords.reduce((sum, r) => sum + r.total, 0);

  const stats = [
    { label: 'Total Units', value: totalUnits.toLocaleString(), icon: Gauge, tone: 'from-amber-400 to-yellow-500 shadow-amber-500/25' },
    { label: 'Electricity', value: `₹${totalElectricity.toLocaleString()}`, icon: Zap, tone: 'from-emerald-500 to-teal-500 shadow-emerald-500/25' },
    { label: 'Other Charges', value: `₹${totalOtherCharges.toLocaleString()}`, icon: Receipt, tone: 'from-sky-500 to-cyan-500 shadow-sky-500/25' },
    { label: 'Total Amount', value: `₹${totalAmount.toLocaleString()}`, icon: CircleDollarSign, tone: 'from-violet-500 to-purple-500 shadow-violet-500/25' },
  ];

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="pb-24 md:ml-64 md:pb-10">
        <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-lg shadow-amber-500/25">
                <Zap className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Electricity</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {filteredRecords.length} of {electricityRecords.length} bills
                </p>
              </div>
            </div>
            <Button onClick={downloadPDF}>
              <Download className="h-5 w-5" />
              Download PDF
            </Button>
          </header>

          <Card>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="relative sm:col-span-2 lg:col-span-4">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search tenant, property or room…"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select
                value={filters.propertyId}
                onChange={(e) => handleFilterChange('propertyId', e.target.value)}
              >
                <option value="">All Properties</option>
                {properties.map(prop => (
                  <option key={prop.id} value={prop.id}>{prop.name}</option>
                ))}
              </Select>

              <Select
                value={filters.roomId}
                onChange={(e) => handleFilterChange('roomId', e.target.value)}
              >
                <option value="">All Rooms</option>
                {rooms.map(room => (
                  <option key={room.id} value={room.id}>Room {room.roomNumber}</option>
                ))}
              </Select>

              <Select
                value={filters.month}
                onChange={(e) => handleFilterChange('month', e.target.value)}
              >
                <option value="">All Months</option>
                {monthOpts.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>

              <Select
                value={filters.year}
                onChange={(e) => handleFilterChange('year', e.target.value)}
                className="sm:col-span-2 lg:col-span-1"
              >
                <option value="">All Years</option>
                {[...new Set(monthOpts.map(o => o.value.slice(0, 4)))].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </Select>
            </CardContent>
          </Card>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label} className="hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-900/5">
                <CardContent className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                    <p className="mt-1 truncate text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      {stat.value}
                    </p>
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

          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[64rem]">
                  <thead className="bg-slate-50/80 dark:bg-white/5">
                    <tr>
                      <th className={thClass}>Property</th>
                      <th className={thClass}>Room</th>
                      <th className={thClass}>Tenant</th>
                      <th className={thClass}>Month</th>
                      <th className={thClass}>Bill Date</th>
                      <th className={thClass}>Prev</th>
                      <th className={thClass}>Curr</th>
                      <th className={thClass}>Units</th>
                      <th className={thClass}>Rate</th>
                      <th className={thClass}>Elec</th>
                      <th className={thClass}>Other</th>
                      <th className={thClass}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((record) => (
                      <tr
                        key={record.id}
                        className="border-t border-slate-100 transition-colors hover:bg-amber-50/60 dark:border-white/5 dark:hover:bg-white/5"
                      >
                        <td className={cn(tdClass, 'font-medium text-slate-900 dark:text-white')}>
                          {record.propertyName || '-'}
                        </td>
                        <td className={tdClass}>{record.roomNumber || '-'}</td>
                        <td className={tdClass}>{record.tenantName || 'Vacant'}</td>
                        <td className={tdClass}>{record.monthLabel || record.month}</td>
                        <td className={tdClass}>{record.billDate || '-'}</td>
                        <td className={tdClass}>{record.previousReading}</td>
                        <td className={tdClass}>{record.currentReading}</td>
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <span className="inline-block rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/25">
                            {record.units}
                          </span>
                        </td>
                        <td className={tdClass}>₹{record.ratePerUnit}</td>
                        <td className={tdClass}>₹{record.electricityAmount.toLocaleString()}</td>
                        <td className={tdClass}>₹{record.otherCharges.toLocaleString()}</td>
                        <td className={cn(tdClass, 'font-semibold text-slate-900 dark:text-white')}>
                          ₹{record.total.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredRecords.length === 0 && (
                <div className="py-14 text-center">
                  <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500">
                    <Zap className="h-6 w-6" />
                  </span>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    No electricity records found
                  </p>
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    Try clearing one of the filters above.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
