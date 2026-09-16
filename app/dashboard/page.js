'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import MobileNav from '../../components/MobileNav';
import Card, { CardHeader, CardContent, CardTitle } from '../../components/Card';
import { getDashboard, getRent, getProperties, getRooms } from '../../lib/api';
import { Building2, Users, DollarSign, TrendingUp, TrendingDown, Zap, Receipt } from 'lucide-react';

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
      const [dashboardData, rentData, propertiesData, roomsData] = await Promise.all([
        getDashboard(),
        getRent(),
        getProperties(),
        getRooms()
      ]);

      setDashboard(dashboardData);

      const recent = rentData
        .filter(r => r.paymentDate)
        .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
        .slice(0, 5);

      const pending = rentData.filter(r => r.status !== 'Paid');

      const enrichedRecent = recent.map(rent => {
        const room = roomsData.find(r => r.id === rent.roomId);
        const property = propertiesData.find(p => p.id === room?.propertyId);
        return {
          ...rent,
          roomNumber: room?.roomNumber,
          tenantName: room?.tenantName,
          propertyName: property?.name
        };
      });

      const enrichedPending = pending.map(rent => {
        const room = roomsData.find(r => r.id === rent.roomId);
        const property = propertiesData.find(p => p.id === room?.propertyId);
        return {
          ...rent,
          roomNumber: room?.roomNumber,
          tenantName: room?.tenantName,
          propertyName: property?.name
        };
      });

      setRecentPayments(enrichedRecent);
      setPendingRents(enrichedPending);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="md:ml-64 pb-20 md:pb-0">
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">September 2026</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Expected Rent</p>
                    <p className="text-2xl font-bold text-gray-800">₹{dashboard?.expectedRent?.toLocaleString()}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Collected Rent</p>
                    <p className="text-2xl font-bold text-green-600">₹{dashboard?.collectedRent?.toLocaleString()}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending Rent</p>
                    <p className="text-2xl font-bold text-red-600">₹{dashboard?.pendingRent?.toLocaleString()}</p>
                  </div>
                  <div className="bg-red-100 p-3 rounded-full">
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Electricity</p>
                    <p className="text-2xl font-bold text-yellow-600">₹{dashboard?.electricityExpense?.toLocaleString()}</p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <Zap className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-4 rounded-full">
                    <Building2 className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-800">{dashboard?.totalProperties}</p>
                    <p className="text-sm text-gray-600">Total Properties</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rooms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-4 rounded-full">
                    <Users className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-800">{dashboard?.totalRooms}</p>
                    <p className="text-sm text-gray-600">Total Rooms</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Other Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 p-4 rounded-full">
                    <Receipt className="w-8 h-8 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-800">₹{dashboard?.otherExpenses?.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">This Month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Payments</CardTitle>
              </CardHeader>
              <CardContent>
                {recentPayments.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No recent payments</p>
                ) : (
                  <div className="space-y-3">
                    {recentPayments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">{payment.tenantName || 'Vacant'}</p>
                          <p className="text-sm text-gray-600">{payment.propertyName} - Room {payment.roomNumber}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">₹{payment.paidAmount.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">{payment.paymentDate}</p>
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
              </CardHeader>
              <CardContent>
                {pendingRents.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No pending rents</p>
                ) : (
                  <div className="space-y-3">
                    {pendingRents.map((rent) => (
                      <div key={rent.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">{rent.tenantName || 'Vacant'}</p>
                          <p className="text-sm text-gray-600">{rent.propertyName} - Room {rent.roomNumber}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-red-600">₹{rent?.remaining?.toLocaleString()}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            rent.status === 'Partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {rent.status}
                          </span>
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
      <MobileNav />
    </div>
  );
}
