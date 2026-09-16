'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '../../../../../components/Sidebar';
import MobileNav from '../../../../../components/MobileNav';
import Card, { CardContent, CardTitle, CardHeader } from '../../../../../components/Card';
import Button from '../../../../../components/Button';
import Input from '../../../../../components/Input';
import { getProperties, getRooms, getRent, createRent, getElectricity, createElectricity } from '../../../../../lib/api';
import { Home, User, DollarSign, Zap, Plus, ArrowLeft } from 'lucide-react';

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

  const [rentFormData, setRentFormData] = useState({
    month: '',
    year: '',
    rentAmount: '',
    paidAmount: '',
    paymentDate: '',
    paymentMethod: '',
    notes: ''
  });

  const [electricityFormData, setElectricityFormData] = useState({
    month: '',
    year: '',
    billDate: '',
    previousReading: '',
    currentReading: '',
    ratePerUnit: '',
    otherCharges: ''
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
  }, [propertyId, roomId, router]);

  const fetchData = async () => {
    try {
      const [propertiesData, roomsData, rentData, electricityData] = await Promise.all([
        getProperties(),
        getRooms(),
        getRent(),
        getElectricity()
      ]);

      const propertyData = propertiesData.find(p => p.id === parseInt(propertyId));
      const roomData = roomsData.find(r => r.id === parseInt(roomId));
      const roomRentData = rentData.filter(r => r.roomId === parseInt(roomId));
      const roomElectricityData = electricityData.filter(e => e.roomId === parseInt(roomId));

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
      const rentData = {
        roomId: parseInt(roomId),
        month: rentFormData.month,
        year: parseInt(rentFormData.year),
        rentAmount: parseFloat(rentFormData.rentAmount),
        paidAmount: parseFloat(rentFormData.paidAmount),
        paymentDate: rentFormData.paymentDate,
        paymentMethod: rentFormData.paymentMethod,
        notes: rentFormData.notes
      };

      await createRent(rentData);
      setShowRentModal(false);
      setRentFormData({
        month: '',
        year: '',
        rentAmount: '',
        paidAmount: '',
        paymentDate: '',
        paymentMethod: '',
        notes: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error saving rent:', error);
    }
  };

  const handleElectricitySubmit = async (e) => {
    e.preventDefault();
    try {
      const electricityData = {
        roomId: parseInt(roomId),
        month: electricityFormData.month,
        year: parseInt(electricityFormData.year),
        billDate: electricityFormData.billDate,
        previousReading: parseFloat(electricityFormData.previousReading),
        currentReading: parseFloat(electricityFormData.currentReading),
        ratePerUnit: parseFloat(electricityFormData.ratePerUnit),
        otherCharges: parseFloat(electricityFormData.otherCharges)
      };

      await createElectricity(electricityData);
      setShowElectricityModal(false);
      setElectricityFormData({
        month: '',
        year: '',
        billDate: '',
        previousReading: '',
        currentReading: '',
        ratePerUnit: '',
        otherCharges: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error saving electricity:', error);
    }
  };

  const getPreviousReading = () => {
    const sortedRecords = [...electricityRecords].sort((a, b) => new Date(b.billDate) - new Date(a.billDate));
    return sortedRecords.length > 0 ? sortedRecords[0].currentReading : 0;
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

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Room not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="md:ml-64 pb-20 md:pb-0">
        <div className="p-6">
          <Button
            variant="secondary"
            className="mb-4"
            onClick={() => router.push(`/properties/${propertyId}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Property
          </Button>

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className={`${room.occupied ? 'bg-green-100' : 'bg-gray-100'} p-4 rounded-full`}>
                  <Home className={`w-8 h-8 ${room.occupied ? 'text-green-600' : 'text-gray-600'}`} />
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-800">Room {room.roomNumber}</h1>
                  <p className="text-gray-600 mt-2">{property?.name}</p>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm ${room.occupied ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {room.occupied ? 'Occupied' : 'Vacant'}
                  </span>
                </div>
              </div>

              {room.occupied && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="w-5 h-5" />
                    <span className="font-medium">{room.tenantName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="font-medium">{room.tenantPhone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign className="w-5 h-5" />
                    <span className="font-medium">₹{room.monthlyRent?.toLocaleString()}/month</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="font-medium">Security: ₹{room.securityDeposit?.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {room.notes && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">{room.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="p-6 border-b border-gray-200 flex items-center justify-between">
                <CardTitle>Rent Records</CardTitle>
                <Button onClick={() => setShowRentModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Rent
                </Button>
              </CardHeader>
              <CardContent className="p-6">
                {rentRecords.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No rent records found</p>
                ) : (
                  <div className="space-y-3">
                    {rentRecords
                      .sort((a, b) => new Date(b.year, months.indexOf(b.month)) - new Date(a.year, months.indexOf(a.month)))
                      .map((record) => (
                        <div key={record.id} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-800">{record.month} {record.year}</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(record.status)}`}>
                              {record.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600">Rent:</span>
                              <span className="font-medium ml-2">₹{record.rentAmount?.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Paid:</span>
                              <span className="font-medium ml-2 text-green-600">₹{record.paidAmount?.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Remaining:</span>
                              <span className="font-medium ml-2 text-red-600">₹{record.remaining?.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Date:</span>
                              <span className="font-medium ml-2">{record.paymentDate || '-'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-6 border-b border-gray-200 flex items-center justify-between">
                <CardTitle>Electricity Records</CardTitle>
                <Button onClick={() => setShowElectricityModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Electricity
                </Button>
              </CardHeader>
              <CardContent className="p-6">
                {electricityRecords.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No electricity records found</p>
                ) : (
                  <div className="space-y-3">
                    {electricityRecords
                      .sort((a, b) => new Date(b.year, months.indexOf(b.month)) - new Date(a.year, months.indexOf(a.month)))
                      .map((record) => (
                        <div key={record.id} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-800">{record.month} {record.year}</span>
                            <Zap className="w-5 h-5 text-yellow-600" />
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600">Prev:</span>
                              <span className="font-medium ml-2">{record.previousReading}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Curr:</span>
                              <span className="font-medium ml-2">{record.currentReading}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Units:</span>
                              <span className="font-medium ml-2">{record.units}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Total:</span>
                              <span className="font-medium ml-2">₹{record.total?.toLocaleString()}</span>
                            </div>
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

      {showRentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Add Rent</h2>
            </div>
            <form onSubmit={handleRentSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Month
                </label>
                <select
                  value={rentFormData.month}
                  onChange={(e) => setRentFormData({ ...rentFormData, month: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Month</option>
                  {months.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year
                </label>
                <select
                  value={rentFormData.year}
                  onChange={(e) => setRentFormData({ ...rentFormData, year: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Year</option>
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rent Amount (₹)
                </label>
                <Input
                  type="number"
                  value={rentFormData.rentAmount}
                  onChange={(e) => setRentFormData({ ...rentFormData, rentAmount: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paid Amount (₹)
                </label>
                <Input
                  type="number"
                  value={rentFormData.paidAmount}
                  onChange={(e) => setRentFormData({ ...rentFormData, paidAmount: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Date
                </label>
                <Input
                  type="date"
                  value={rentFormData.paymentDate}
                  onChange={(e) => setRentFormData({ ...rentFormData, paymentDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={rentFormData.paymentMethod}
                  onChange={(e) => setRentFormData({ ...rentFormData, paymentMethod: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Method</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={rentFormData.notes}
                  onChange={(e) => setRentFormData({ ...rentFormData, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowRentModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Add Rent
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showElectricityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Add Electricity</h2>
            </div>
            <form onSubmit={handleElectricitySubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Month
                </label>
                <select
                  value={electricityFormData.month}
                  onChange={(e) => setElectricityFormData({ ...electricityFormData, month: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Month</option>
                  {months.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year
                </label>
                <select
                  value={electricityFormData.year}
                  onChange={(e) => setElectricityFormData({ ...electricityFormData, year: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Year</option>
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bill Date
                </label>
                <Input
                  type="date"
                  value={electricityFormData.billDate}
                  onChange={(e) => setElectricityFormData({ ...electricityFormData, billDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Previous Reading
                </label>
                <Input
                  type="number"
                  value={electricityFormData.previousReading}
                  onChange={(e) => setElectricityFormData({ ...electricityFormData, previousReading: e.target.value })}
                  placeholder={`Auto: ${getPreviousReading()}`}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Reading
                </label>
                <Input
                  type="number"
                  value={electricityFormData.currentReading}
                  onChange={(e) => setElectricityFormData({ ...electricityFormData, currentReading: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rate Per Unit (₹)
                </label>
                <Input
                  type="number"
                  value={electricityFormData.ratePerUnit}
                  onChange={(e) => setElectricityFormData({ ...electricityFormData, ratePerUnit: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Other Charges (₹)
                </label>
                <Input
                  type="number"
                  value={electricityFormData.otherCharges}
                  onChange={(e) => setElectricityFormData({ ...electricityFormData, otherCharges: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowElectricityModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Add Electricity
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <MobileNav />
    </div>
  );
}
