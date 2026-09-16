'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import MobileNav from '../../components/MobileNav';
import Card, { CardContent, CardTitle } from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { getRent, getProperties, getRooms } from '../../lib/api';
import { Download, Search, Filter } from 'lucide-react';
import jsPDF from 'jspdf';

export default function RentPage() {
  const router = useRouter();
  const [rentRecords, setRentRecords] = useState([]);
  const [properties, setProperties] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    propertyId: '',
    roomId: '',
    month: '',
    year: '',
    status: '',
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
  }, [rentRecords, filters]);

  const fetchData = async () => {
    try {
      const [rentData, propertiesData, roomsData] = await Promise.all([
        getRent(),
        getProperties(),
        getRooms()
      ]);

      const enrichedRent = rentData.map(rent => {
        const room = roomsData.find(r => r.id === rent.roomId);
        const property = propertiesData.find(p => p.id === room?.propertyId);
        return {
          ...rent,
          roomNumber: room?.roomNumber,
          tenantName: room?.tenantName,
          propertyName: property?.name
        };
      });

      setRentRecords(enrichedRent);
      setProperties(propertiesData);
      setRooms(roomsData);
    } catch (error) {
      console.error('Error fetching rent data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...rentRecords];

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

    if (filters.status) {
      filtered = filtered.filter(r => r.status === filters.status);
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
    doc.text('Rent Report', 14, 22);
    
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
    doc.setFontSize(10);
    doc.text('Property', 14, y);
    doc.text('Room', 50, y);
    doc.text('Tenant', 70, y);
    doc.text('Month', 110, y);
    doc.text('Rent', 140, y);
    doc.text('Paid', 160, y);
    doc.text('Status', 180, y);

    y += 8;
    doc.line(14, y - 2, 200, y - 2);

    filteredRecords.forEach(record => {
      y += 7;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(record.propertyName || '-', 14, y);
      doc.text(record.roomNumber || '-', 50, y);
      doc.text(record.tenantName || '-', 70, y);
      doc.text(`${record.month} ${record.year}`, 110, y);
      doc.text(`₹${record.rentAmount}`, 140, y);
      doc.text(`₹${record.paidAmount}`, 160, y);
      doc.text(record.status, 180, y);
    });

    y += 10;
    const totalRent = filteredRecords.reduce((sum, r) => sum + r.rentAmount, 0);
    const totalPaid = filteredRecords.reduce((sum, r) => sum + r.paidAmount, 0);
    const totalPending = filteredRecords.reduce((sum, r) => sum + r.remaining, 0);

    doc.setFontSize(12);
    doc.text(`Total Rent: ₹${totalRent.toLocaleString()}`, 14, y);
    doc.text(`Total Paid: ₹${totalPaid.toLocaleString()}`, 14, y + 8);
    doc.text(`Total Pending: ₹${totalPending.toLocaleString()}`, 14, y + 16);

    doc.save('rent-report.pdf');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-700';
      case 'Partial': return 'bg-yellow-100 text-yellow-700';
      case 'Pending': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const totalRent = filteredRecords.reduce((sum, r) => sum + r.rentAmount, 0);
  const totalPaid = filteredRecords.reduce((sum, r) => sum + r.paidAmount, 0);
  const totalPending = filteredRecords.reduce((sum, r) => sum + r.remaining, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="md:ml-64 pb-20 md:pb-0">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Rent</h1>
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

                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="Paid">Paid</option>
                  <option value="Partial">Partial</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-600">Total Rent</p>
                <p className="text-2xl font-bold text-gray-800">₹{totalRent.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">₹{totalPaid.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-600">Total Pending</p>
                <p className="text-2xl font-bold text-red-600">₹{totalPending.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rent</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRecords?.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.propertyName || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.roomNumber || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.tenantName || 'Vacant'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.month} {record.year}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{record.rentAmount?.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{record.paidAmount?.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{record.remaining?.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(record.status)}`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.paymentDate || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredRecords.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No rent records found</p>
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
