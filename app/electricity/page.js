'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import MobileNav from '../../components/MobileNav';
import Card, { CardContent, CardTitle } from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { getElectricity, getProperties, getRooms } from '../../lib/api';
import { Download, Search, Zap } from 'lucide-react';
import jsPDF from 'jspdf';

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

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const years = [2025, 2026, 2027];

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

      const enrichedElectricity = electricityData.map(record => {
        const room = roomsData.find(r => r.id === record.roomId);
        const property = propertiesData.find(p => p.id === room?.propertyId);
        return {
          ...record,
          roomNumber: room?.roomNumber,
          tenantName: room?.tenantName,
          propertyName: property?.name,
          units: record.currentReading - record.previousReading,
          electricityAmount: (record.currentReading - record.previousReading) * record.ratePerUnit,
          total: (record.currentReading - record.previousReading) * record.ratePerUnit + record.otherCharges
        };
      });

      setElectricityRecords(enrichedElectricity);
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
      filtered = filtered.filter(r => r.year === parseInt(filters.year));
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
      doc.text(`Month: ${filters.month}`, 14, 44);
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
      doc.text(`${record.month} ${record.year}`, 85, y);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const totalUnits = filteredRecords.reduce((sum, r) => sum + r.units, 0);
  const totalElectricity = filteredRecords.reduce((sum, r) => sum + r.electricityAmount, 0);
  const totalOtherCharges = filteredRecords.reduce((sum, r) => sum + r.otherCharges, 0);
  const totalAmount = filteredRecords.reduce((sum, r) => sum + r.total, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="md:ml-64 pb-20 md:pb-0">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Electricity</h1>
            <Button onClick={downloadPDF}>
              <Download className="w-5 h-5 mr-2" />
              Download PDF
            </Button>
          </div>

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      placeholder="Search by tenant, property, or room..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <select
                  value={filters.propertyId}
                  onChange={(e) => handleFilterChange('propertyId', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Properties</option>
                  {properties.map(prop => (
                    <option key={prop.id} value={prop.id}>{prop.name}</option>
                  ))}
                </select>

                <select
                  value={filters.roomId}
                  onChange={(e) => handleFilterChange('roomId', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Rooms</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>Room {room.roomNumber}</option>
                  ))}
                </select>

                <select
                  value={filters.month}
                  onChange={(e) => handleFilterChange('month', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Months</option>
                  {months.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>

                <select
                  value={filters.year}
                  onChange={(e) => handleFilterChange('year', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Years</option>
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <Zap className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Units</p>
                    <p className="text-2xl font-bold text-gray-800">{totalUnits}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-600">Total Electricity</p>
                <p className="text-2xl font-bold text-gray-800">₹{totalElectricity.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-600">Other Charges</p>
                <p className="text-2xl font-bold text-gray-800">₹{totalOtherCharges.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-blue-600">₹{totalAmount.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prev</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Curr</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Units</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Elec</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Other</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{record.propertyName || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{record.roomNumber || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{record.tenantName || 'Vacant'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{record.month} {record.year}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{record.billDate || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{record.previousReading}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{record.currentReading}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{record.units}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">₹{record.ratePerUnit}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">₹{record.electricityAmount.toLocaleString()}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">₹{record.otherCharges.toLocaleString()}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">₹{record.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredRecords.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No electricity records found</p>
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
